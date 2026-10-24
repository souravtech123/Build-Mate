package services

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"buildmate/backend/models"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin for WebSocket connections
	},
}

// Client represents an active WebSocket client in a project room
type Client struct {
	Hub       *ChatHub
	Conn      *websocket.Conn
	Send      chan []byte
	ProjectID uint
	UserID    uint
	UserName  string
	UserRole  string
}

// InboundClientMessage represents the payload sent by the frontend
type InboundClientMessage struct {
	Type    string `json:"type"` // "chat", "ping"
	Message string `json:"message"`
}

// BroadcastPayload represents what is sent down to clients
type BroadcastPayload struct {
	Type    string             `json:"type"` // "chat", "system", "user_joined", "user_left"
	Data    models.ChatMessage `json:"data"`
	Online  int                `json:"online_count,omitempty"`
}

// ChatHub manages all project chat rooms and connections
type ChatHub struct {
	DB         *gorm.DB
	rooms      map[uint]map[*Client]bool
	roomsMutex sync.RWMutex
	Register   chan *Client
	Unregister chan *Client
}

func NewChatHub(db *gorm.DB) *ChatHub {
	hub := &ChatHub{
		DB:         db,
		rooms:      make(map[uint]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
	go hub.run()
	return hub
}

func (h *ChatHub) run() {
	for {
		select {
		case client := <-h.Register:
			h.roomsMutex.Lock()
			if _, ok := h.rooms[client.ProjectID]; !ok {
				h.rooms[client.ProjectID] = make(map[*Client]bool)
			}
			h.rooms[client.ProjectID][client] = true
			onlineCount := len(h.rooms[client.ProjectID])
			h.roomsMutex.Unlock()

			// Broadcast system notification that user connected
			sysMsg := BroadcastPayload{
				Type: "user_joined",
				Data: models.ChatMessage{
					ProjectID:   client.ProjectID,
					SenderID:    client.UserID,
					SenderName:  client.UserName,
					SenderRole:  client.UserRole,
					Message:     client.UserName + " joined the chat",
					MessageType: "system",
					CreatedAt:   time.Now(),
				},
				Online: onlineCount,
			}
			h.BroadcastToRoom(client.ProjectID, sysMsg)

		case client := <-h.Unregister:
			h.roomsMutex.Lock()
			if clients, ok := h.rooms[client.ProjectID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
				}
				onlineCount := len(clients)
				if len(clients) == 0 {
					delete(h.rooms, client.ProjectID)
				}
				h.roomsMutex.Unlock()

				// Broadcast leave notification
				sysMsg := BroadcastPayload{
					Type: "user_left",
					Data: models.ChatMessage{
						ProjectID:   client.ProjectID,
						SenderID:    client.UserID,
						SenderName:  client.UserName,
						SenderRole:  client.UserRole,
						Message:     client.UserName + " left the chat",
						MessageType: "system",
						CreatedAt:   time.Now(),
					},
					Online: onlineCount,
				}
				h.BroadcastToRoom(client.ProjectID, sysMsg)
			} else {
				h.roomsMutex.Unlock()
			}
		}
	}
}

// BroadcastToRoom sends a JSON payload to all clients in a project room
func (h *ChatHub) BroadcastToRoom(projectID uint, payload BroadcastPayload) {
	bytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("failed to marshal broadcast payload: %v", err)
		return
	}

	h.roomsMutex.RLock()
	clients, ok := h.rooms[projectID]
	if !ok {
		h.roomsMutex.RUnlock()
		return
	}

	for client := range clients {
		select {
		case client.Send <- bytes:
		default:
			// If client buffer is blocked, close and let unregister handle it
			close(client.Send)
			delete(clients, client)
		}
	}
	h.roomsMutex.RUnlock()
}

// ReadPump listens for incoming messages from the WebSocket client
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket read error: %v", err)
			}
			break
		}

		var inbound InboundClientMessage
		if err := json.Unmarshal(messageBytes, &inbound); err != nil {
			// Plain text fallback
			inbound.Message = string(messageBytes)
			inbound.Type = "chat"
		}

		if inbound.Message == "" {
			continue
		}

		// Persist message to database
		chatMsg := models.ChatMessage{
			ProjectID:   c.ProjectID,
			SenderID:    c.UserID,
			SenderName:  c.UserName,
			SenderRole:  c.UserRole,
			Message:     inbound.Message,
			MessageType: "text",
			CreatedAt:   time.Now(),
		}

		if err := c.Hub.DB.Create(&chatMsg).Error; err != nil {
			log.Printf("failed to persist chat message: %v", err)
			continue
		}

		// Broadcast to room
		c.Hub.BroadcastToRoom(c.ProjectID, BroadcastPayload{
			Type: "chat",
			Data: chatMsg,
		})
	}
}

// WritePump pushes messages from the send channel to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Add queued chat messages to the current websocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// UpgradeConnection upgrades HTTP to WebSocket
func (h *ChatHub) UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

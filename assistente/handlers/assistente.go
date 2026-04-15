package handlers

import (
	"assistente/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Interpretar(c *gin.Context) {
	var body struct {
		Mensagem string `json:"mensagem"`
	}

	if err := c.ShouldBindJSON(&body); err != nil || body.Mensagem == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mensagem é obrigatória"})
		return
	}

	intencao, err := services.ConsultarGemini(body.Mensagem)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, intencao)
}
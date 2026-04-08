package main

import (
	"estoque/db"
	"estoque/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Init()

	r := gin.Default()

	// CORS básico para o Angular conseguir chamar
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/produtos", handlers.ListarProdutos)
	r.POST("/produtos", handlers.CriarProduto)
	r.POST("/produtos/debitar", handlers.DebitarSaldo)

	r.Run(":8081")
}

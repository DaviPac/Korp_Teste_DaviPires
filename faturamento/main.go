package main

import (
	"faturamento/db"
	"faturamento/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Init()

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/notas", handlers.ListarNotas)
	r.POST("/notas", handlers.CriarNota)
	r.POST("/notas/:id/imprimir", handlers.ImprimirNota)

	r.Run(":8082")
}

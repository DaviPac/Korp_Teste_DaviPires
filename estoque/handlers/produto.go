package handlers

import (
	"estoque/db"
	"estoque/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListarProdutos(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, codigo, descricao, saldo FROM produtos")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var produtos []models.Produto
	for rows.Next() {
		var p models.Produto
		rows.Scan(&p.ID, &p.Codigo, &p.Descricao, &p.Saldo)
		produtos = append(produtos, p)
	}

	c.JSON(http.StatusOK, produtos)
}

func CriarProduto(c *gin.Context) {
	var p models.Produto
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	err := db.DB.QueryRow(
		"INSERT INTO produtos (codigo, descricao, saldo) VALUES ($1, $2, $3) RETURNING id",
		p.Codigo, p.Descricao, p.Saldo,
	).Scan(&p.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func DebitarSaldo(c *gin.Context) {
	var body struct {
		Codigo     string `json:"codigo"`
		Quantidade int    `json:"quantidade"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	var saldoAtual int
	err := db.DB.QueryRow(
		"SELECT saldo FROM produtos WHERE codigo = $1", body.Codigo,
	).Scan(&saldoAtual)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	if saldoAtual < body.Quantidade {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo insuficiente"})
		return
	}

	db.DB.Exec(
		"UPDATE produtos SET saldo = saldo - $1 WHERE codigo = $2",
		body.Quantidade, body.Codigo,
	)

	c.JSON(http.StatusOK, gin.H{"mensagem": "Saldo atualizado com sucesso"})
}

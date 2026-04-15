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
        Itens []struct {
            Codigo     string `json:"codigo"`
            Quantidade int    `json:"quantidade"`
        } `json:"itens"`
    }

    if err := c.ShouldBindJSON(&body); err != nil || len(body.Itens) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
        return
    }

    tx, err := db.DB.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao iniciar transação"})
        return
    }
    defer tx.Rollback()

    for _, item := range body.Itens {
        result, err := tx.Exec(`
            UPDATE produtos
            SET saldo = saldo - $1
            WHERE codigo = $2 AND saldo >= $1
        `, item.Quantidade, item.Codigo)

        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        linhasAfetadas, _ := result.RowsAffected()
        if linhasAfetadas == 0 {
            var existe bool
            tx.QueryRow(
                "SELECT EXISTS(SELECT 1 FROM produtos WHERE codigo = $1)", item.Codigo,
            ).Scan(&existe)

            if !existe {
                c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado: " + item.Codigo})
                return
            }

            c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo insuficiente para: " + item.Codigo})
            return
        }
    }

    if err = tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao confirmar transação"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"mensagem": "Estoque atualizado com sucesso"})
}

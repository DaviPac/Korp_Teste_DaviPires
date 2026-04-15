package handlers

import (
	"faturamento/db"
	"faturamento/models"
	"faturamento/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func ListarNotas(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, numero, status FROM notas ORDER BY numero")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	notas := make([]models.Nota, 0)

	for rows.Next() {
		var n models.Nota
		rows.Scan(&n.ID, &n.Numero, &n.Status)
		n.Itens = make([]models.ItemNota, 0)

		itemRows, err := db.DB.Query(
			"SELECT id, nota_id, codigo, quantidade FROM itens_nota WHERE nota_id = $1", 
			n.ID,
		)
		
		if err == nil {
			for itemRows.Next() {
				var item models.ItemNota
				itemRows.Scan(&item.ID, &item.NotaID, &item.Codigo, &item.Quantidade)
				n.Itens = append(n.Itens, item)
			}
			itemRows.Close()
		}
		notas = append(notas, n)
	}
	c.JSON(http.StatusOK, notas)
}

func CriarNota(c *gin.Context) {
	var body struct {
		Itens []models.ItemNota `json:"itens"`
	}

	if err := c.ShouldBindJSON(&body); err != nil || len(body.Itens) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informe ao menos um item"})
		return
	}

	// Numeração sequencial automática
	var proximoNumero int
	db.DB.QueryRow("SELECT COALESCE(MAX(numero), 0) + 1 FROM notas").Scan(&proximoNumero)

	var notaID int
	err := db.DB.QueryRow(
		"INSERT INTO notas (numero, status) VALUES ($1, 'Aberta') RETURNING id",
		proximoNumero,
	).Scan(&notaID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, item := range body.Itens {
		db.DB.Exec(
			"INSERT INTO itens_nota (nota_id, codigo, quantidade) VALUES ($1, $2, $3)",
			notaID, item.Codigo, item.Quantidade,
		)
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":     notaID,
		"numero": proximoNumero,
		"status": "Aberta",
		"itens":  body.Itens,
	})
}

func ImprimirNota(c *gin.Context) {
    id, _ := strconv.Atoi(c.Param("id"))

    result, err := db.DB.Exec(`
        UPDATE notas SET status = 'Fechada' 
        WHERE id = $1 AND status = 'Aberta'
    `, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    linhasAfetadas, _ := result.RowsAffected()
    if linhasAfetadas == 0 {
        var status string
        err := db.DB.QueryRow("SELECT status FROM notas WHERE id = $1", id).Scan(&status)
        if err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "Nota não encontrada"})
            return
        }
        c.JSON(http.StatusBadRequest, gin.H{"error": "Apenas notas com status Aberta podem ser impressas"})
        return
    }

    var nota models.Nota
    err = db.DB.QueryRow(
		"SELECT id, numero, status FROM notas WHERE id = $1", id,
	).Scan(&nota.ID, &nota.Numero, &nota.Status)

    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Nota não encontrada"})
        return
    }

    rows, _ := db.DB.Query(
        "SELECT id, nota_id, codigo, quantidade FROM itens_nota WHERE nota_id = $1", id,
    )
    defer rows.Close()

    var itens []models.ItemNota
    for rows.Next() {
        var item models.ItemNota
        rows.Scan(&item.ID, &item.NotaID, &item.Codigo, &item.Quantidade)
        itens = append(itens, item)
    }

    var lote []services.ItemDebito
    for _, item := range itens {
        lote = append(lote, services.ItemDebito{
            Codigo:     item.Codigo,
            Quantidade: item.Quantidade,
        })
    }
    err = services.DebitarEstoque(lote)
    if err != nil {
        db.DB.Exec("UPDATE notas SET status = 'Aberta' WHERE id = $1", id)
        c.JSON(http.StatusServiceUnavailable, gin.H{
            "error": "Falha ao atualizar estoque: " + err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "mensagem": "Nota impressa com sucesso",
        "id":       nota.ID,
        "numero":   nota.Numero,
        "status":   "Fechada",
        "itens":    itens,
    })
}

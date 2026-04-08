package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"os"
)

func DebitarEstoque(codigo string, quantidade int) error {
	body, _ := json.Marshal(map[string]interface{}{
		"codigo":     codigo,
		"quantidade": quantidade,
	})

	url := os.Getenv("ESTOQUE_URL") + "/produtos/debitar"

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		// Serviço de estoque está fora — falha tratada aqui
		return errors.New("serviço de estoque indisponível")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var resultado map[string]string
		json.NewDecoder(resp.Body).Decode(&resultado)
		return errors.New(resultado["error"])
	}

	return nil
}

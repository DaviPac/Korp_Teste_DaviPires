package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"os"
)

type ItemDebito struct {
    Codigo     string `json:"codigo"`
    Quantidade int    `json:"quantidade"`
}

func DebitarEstoque(itens []ItemDebito) error {
    body, _ := json.Marshal(map[string]any{
        "itens": itens,
    })

    url := os.Getenv("ESTOQUE_URL") + "/produtos/debitar"

    resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
    if err != nil {
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

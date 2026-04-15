package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
)

type IntencaoAssistente struct {
	Operacao string         `json:"operacao"` // "cadastrar_produto" | "criar_nota" | "desconhecido"
	Produto  *DadosProduto  `json:"produto,omitempty"`
	Nota     *DadosNota     `json:"nota,omitempty"`
	Mensagem string         `json:"mensagem"` // resposta amigável ao usuário
}

type DadosProduto struct {
	Codigo    string `json:"codigo"`
	Descricao string `json:"descricao"`
	Saldo     int    `json:"saldo"`
}

type DadosNota struct {
	Itens []ItemNota `json:"itens"`
}

type ItemNota struct {
	Codigo     string `json:"codigo"`
	Quantidade int    `json:"quantidade"`
}

func ConsultarGemini(mensagemUsuario string) (*IntencaoAssistente, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")

	systemPrompt := `Você é um assistente de um sistema de emissão de Notas Fiscais.
O sistema possui duas operações principais:
1. Cadastrar Produto (campos: codigo, descricao, saldo)
2. Criar Nota Fiscal (campos: itens, onde cada item tem codigo e quantidade)

Analise a mensagem do usuário e retorne APENAS um JSON válido, sem explicações, sem markdown, sem backticks.
O JSON deve seguir exatamente este formato:

{
  "operacao": "cadastrar_produto" | "criar_nota" | "desconhecido",
  "produto": { "codigo": "", "descricao": "", "saldo": 0 },
  "nota": { "itens": [{ "codigo": "", "quantidade": 0 }] },
  "mensagem": "mensagem amigável explicando o que foi interpretado"
}

Regras:
- Se a operação for cadastrar_produto, preencha apenas o campo "produto" com os dados extraídos ou sugeridos
- Se a operação for criar_nota, preencha apenas o campo "nota" com os itens extraídos
- Se não entender a intenção, use "desconhecido" e explique na mensagem
- Para campos não mencionados, preencha com valores plausíveis baseados no contexto
- Responda sempre em português`

	payload := map[string]any{
		"contents": []map[string]any{
			{
				"parts": []map[string]any{
					{"text": systemPrompt + "\n\nMensagem do usuário: " + mensagemUsuario},
				},
			},
		},
	}

	body, _ := json.Marshal(payload)

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s",
		apiKey,
	)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, errors.New("erro ao chamar Gemini")
	}
	defer resp.Body.Close()

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, errors.New("erro ao decodificar resposta do Gemini")
	}

	if len(geminiResp.Candidates) == 0 {
		return nil, errors.New("Gemini não retornou resposta")
	}

	texto := geminiResp.Candidates[0].Content.Parts[0].Text

	var intencao IntencaoAssistente
	if err := json.Unmarshal([]byte(texto), &intencao); err != nil {
		return nil, errors.New("erro ao interpretar resposta do Gemini")
	}

	return &intencao, nil
}
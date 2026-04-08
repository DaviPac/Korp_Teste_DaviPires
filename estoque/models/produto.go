package models

type Produto struct {
	ID        int    `json:"id"`
	Codigo    string `json:"codigo"`
	Descricao string `json:"descricao"`
	Saldo     int    `json:"saldo"`
}

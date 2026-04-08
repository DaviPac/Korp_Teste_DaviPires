package models

type ItemNota struct {
	ID         int    `json:"id"`
	NotaID     int    `json:"nota_id"`
	Codigo     string `json:"codigo"`
	Quantidade int    `json:"quantidade"`
}

type Nota struct {
	ID     int        `json:"id"`
	Numero int        `json:"numero"`
	Status string     `json:"status"`
	Itens  []ItemNota `json:"itens"`
}

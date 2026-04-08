package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var DB *sql.DB

func Init() {
	url := os.Getenv("DATABASE_URL")

	var err error
	DB, err = sql.Open("pgx", url)
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Banco não respondeu:", err)
	}

	criarTabela()
	log.Println("Banco de estoque conectado!")
}

func criarTabela() {
	query := `
    CREATE TABLE IF NOT EXISTS produtos (
        id        SERIAL PRIMARY KEY,
        codigo    VARCHAR(50) UNIQUE NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        saldo     INTEGER NOT NULL DEFAULT 0
    );`

	if _, err := DB.Exec(query); err != nil {
		log.Fatal("Erro ao criar tabela:", err)
	}
}

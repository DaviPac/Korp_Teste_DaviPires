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

	criarTabelas()
	log.Println("Banco de faturamento conectado!")
}

func criarTabelas() {
	DB.Exec(`
    CREATE TABLE IF NOT EXISTS notas (
        id     SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'Aberta'
    );`)

	DB.Exec(`
    CREATE TABLE IF NOT EXISTS itens_nota (
        id         SERIAL PRIMARY KEY,
        nota_id    INTEGER REFERENCES notas(id),
        codigo     VARCHAR(50) NOT NULL,
        quantidade INTEGER NOT NULL
    );`)
}

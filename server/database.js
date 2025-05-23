const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

db.serialize(() => {
  // Create products table (uendret)
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('på lager', 'på service', 'på utleie'))
    )
  `);

  // Create rentals table (lagt til project_number)
  db.run(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_number TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL
    )
  `);

  // Create rental_products table (uendret)
  db.run(`
    CREATE TABLE IF NOT EXISTS rental_products (
      rental_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      PRIMARY KEY (rental_id, product_id),
      FOREIGN KEY (rental_id) REFERENCES rentals(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Indexes for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_rental_products_rental_id ON rental_products(rental_id)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_rental_products_product_id ON rental_products(product_id)
  `);
});

module.exports = db;

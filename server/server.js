const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();

app.use(cors());
app.use(express.json());

// Get all products with dynamic status based on current date
app.get('/api/products', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0]; // F.eks. 2025-05-23
  console.log('Fetching all products, current date:', currentDate);
  db.all(
    `
    SELECT p.id, p.name, p.location, p.status,
           CASE
             WHEN EXISTS (
               SELECT 1
               FROM rentals r
               JOIN rental_products rp ON r.id = rp.rental_id
               WHERE rp.product_id = p.id
               AND r.start_date <= ? AND r.end_date >= ?
             ) THEN 'på utleie'
             ELSE p.status
           END as effective_status
    FROM products p
    `,
    [currentDate, currentDate],
    (err, rows) => {
      if (err) {
        console.error('Error fetching products:', err.message);
        return res.status(500).json({ error: err.message });
      }
      const products = rows.map((row) => ({
        id: row.id,
        name: row.name,
        location: row.location,
        status: row.effective_status, // Bruk dynamisk status
      }));
      console.log('Products fetched:', products);
      res.json(products);
    }
  );
});

// Add a product
app.post('/api/products', (req, res) => {
  const { name, location, status } = req.body;
  console.log('Adding product:', { name, location, status });
  db.run(
    'INSERT INTO products (name, location, status) VALUES (?, ?, ?)',
    [name, location, status],
    function (err) {
      if (err) {
        console.error('Error adding product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Product added with id:', this.lastID);
      res.json({ id: this.lastID });
    }
  );
});

// Update product status
app.put('/api/products/:id', (req, res) => {
  const { status } = req.body;
  console.log(`Updating product ${req.params.id} status to: ${status}`);
  db.run(
    'UPDATE products SET status = ? WHERE id = ?',
    [status, req.params.id],
    (err) => {
      if (err) {
        console.error('Error updating product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Product updated');
      res.json({ success: true });
    }
  );
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  console.log(`Deleting product with id: ${req.params.id}`);
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Error deleting product:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('Product deleted');
    res.json({ success: true });
  });
});

// Get rentals for a product
app.get('/api/rentals/:productId', (req, res) => {
  const productId = req.params.productId;
  console.log(`Fetching rentals for product ${productId}`);
  db.all(
    `
    SELECT r.id, r.project_number, r.start_date, r.end_date, GROUP_CONCAT(p.name) as product_names
    FROM rentals r
    JOIN rental_products rp ON r.id = rp.rental_id
    JOIN products p ON rp.product_id = p.id
    WHERE rp.product_id = ?
    GROUP BY r.id
    `,
    [productId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching rentals:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Rentals for product fetched:', rows);
      res.json(rows);
    }
  );
});

// Get all rentals
app.get('/api/rentals', (req, res) => {
  console.log('Fetching all rentals');
  db.all(
    `
    SELECT r.id, r.project_number, r.start_date, r.end_date, GROUP_CONCAT(p.name) as product_names
    FROM rentals r
    JOIN rental_products rp ON r.id = rp.rental_id
    JOIN products p ON rp.product_id = p.id
    GROUP BY r.id
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching rentals:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Rentals fetched:', rows);
      res.json(rows);
    }
  );
});

// Get products for a specific rental
app.get('/api/rentals/:id/products', (req, res) => {
  const rentalId = req.params.id;
  console.log(`Fetching products for rental ${rentalId}`);
  db.all(
    `
    SELECT p.id, p.name, p.location, p.status
    FROM rental_products rp
    JOIN products p ON rp.product_id = p.id
    WHERE rp.rental_id = ?
    `,
    [rentalId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching products for rental:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Products for rental fetched:', rows);
      res.json(rows);
    }
  );
});

// Add a rental
app.post('/api/rentals', (req, res) => {
  const { project_number, product_ids, start_date, end_date } = req.body;
  console.log('Adding rental:', { project_number, product_ids });

  if (!project_number || !product_ids || product_ids.length === 0) {
    return res.status(400).json({ error: 'Prosjektnummer og minst ett produkt kreves' });
  }

  // Check for overlapping rentals for any of the products
  db.all(
    `
    SELECT rp.product_id
    FROM rentals r
    JOIN rental_products rp ON r.id = rp.rental_id
    WHERE rp.product_id IN (${product_ids.map(() => '?').join(',')})
    AND (r.start_date <= ? AND r.end_date >= ?)
    `,
    [...product_ids, end_date, start_date],
    (err, rows) => {
      if (err) {
        console.error('Error checking overlaps:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (rows.length > 0) {
        console.log('Overlap detected for products:', rows);
        return res.status(400).json({ error: 'Ett eller flere produkter er allerede utleid i denne perioden' });
      }

      // Insert the rental
      db.run(
        'INSERT INTO rentals (project_number, start_date, end_date) VALUES (?, ?, ?)',
        [project_number, start_date, end_date],
        function (err) {
          if (err) {
            console.error('Error adding rental:', err.message);
            return res.status(500).json({ error: err.message });
          }
          const rentalId = this.lastID;
          console.log('Rental added with id:', rentalId);

          // Insert product associations
          const placeholders = product_ids.map(() => '(?, ?)').join(',');
          const values = product_ids.flatMap((pid) => [rentalId, pid]);
          db.run(
            `INSERT INTO rental_products (rental_id, product_id) VALUES ${placeholders}`,
            values,
            (err) => {
              if (err) {
                console.error('Error adding rental products:', err.message);
                return res.status(500).json({ error: err.message });
              }
              console.log('Rental products added:', product_ids);

              // Update product statuses to "på utleie"
              db.run(
                `UPDATE products SET status = 'på utleie' WHERE id IN (${product_ids.map(() => '?').join(',')})`,
                product_ids,
                (err) => {
                  if (err) {
                    console.error('Error updating product statuses:', err.message);
                    return res.status(500).json({ error: err.message });
                  }
                  console.log('Product statuses updated to på utleie');
                  res.json({ id: rentalId });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Update a rental
app.put('/api/rentals/:id', (req, res) => {
  const rentalId = req.params.id;
  const { project_number, product_ids, start_date, end_date } = req.body;
  console.log(`Updating rental with id: ${rentalId}`);

  if (!project_number || !product_ids || product_ids.length === 0) {
    return res.status(400).json({ error: 'Prosjektnummer og minst ett produkt kreves' });
  }

  // Check for overlapping rentals for any of the products (excluding this rental)
  db.all(
    `
    SELECT rp.product_id
    FROM rentals r
    JOIN rental_products rp ON r.id = rp.rental_id
    WHERE rp.product_id IN (${product_ids.map(() => '?').join(',')})
    AND r.id != ?
    AND (r.start_date <= ? AND r.end_date >= ?)
    `,
    [...product_ids, rentalId, end_date, start_date],
    (err, rows) => {
      if (err) {
        console.error('Error checking overlaps:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (rows.length > 0) {
        console.log('Overlap detected for products:', rows);
        return res.status(400).json({ error: 'Ett eller flere produkter er allerede utleid i denne perioden' });
      }

      // Update the rental
      db.run(
        'UPDATE rentals SET project_number = ?, start_date = ?, end_date = ? WHERE id = ?',
        [project_number, start_date, end_date, rentalId],
        (err) => {
          if (err) {
            console.error('Error updating rental:', err.message);
            return res.status(500).json({ error: err.message });
          }
          console.log(`Rental ${rentalId} updated`);

          // Delete existing product associations
          db.run('DELETE FROM rental_products WHERE rental_id = ?', [rentalId], (err) => {
            if (err) {
              console.error('Error deleting rental products:', err.message);
              return res.status(500).json({ error: err.message });
            }

            // Insert new product associations
            const placeholders = product_ids.map(() => '(?, ?)').join(',');
            const values = product_ids.flatMap((pid) => [rentalId, pid]);
            db.run(
              `INSERT INTO rental_products (rental_id, product_id) VALUES ${placeholders}`,
              values,
              (err) => {
                if (err) {
                  console.error('Error adding rental products:', err.message);
                  return res.status(500).json({ error: err.message });
                }
                console.log('Rental products updated:', product_ids);

                // Update product statuses to "på utleie"
                db.run(
                  `UPDATE products SET status = 'på utleie' WHERE id IN (${product_ids.map(() => '?').join(',')})`,
                  product_ids,
                  (err) => {
                    if (err) {
                      console.error('Error updating product statuses:', err.message);
                      return res.status(500).json({ error: err.message });
                    }
                    console.log('Product statuses updated to på utleie');
                    res.json({ success: true });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

// Delete a rental
app.delete('/api/rentals/:id', (req, res) => {
  const rentalId = req.params.id;
  console.log(`Deleting rental with id: ${rentalId}`);

  // Get product_ids associated with this rental
  db.all('SELECT product_id FROM rental_products WHERE rental_id = ?', [rentalId], (err, rows) => {
    if (err) {
      console.error('Error fetching rental products:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const productIds = rows.map((row) => row.product_id);

    // Delete the rental
    db.run('DELETE FROM rentals WHERE id = ?', [rentalId], (err) => {
      if (err) {
        console.error('Error deleting rental:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Rental ${rentalId} deleted`);

      // Delete product associations
      db.run('DELETE FROM rental_products WHERE rental_id = ?', [rentalId], (err) => {
        if (err) {
          console.error('Error deleting rental products:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // Update product statuses to "på lager" if no other rentals
        const currentDate = new Date().toISOString().split('T')[0];
        const updatePromises = productIds.map((productId) =>
          new Promise((resolve, reject) => {
            db.get(
              `
              SELECT COUNT(*) as count
              FROM rental_products rp
              JOIN rentals r ON rp.rental_id = r.id
              WHERE rp.product_id = ?
              AND r.start_date <= ? AND r.end_date >= ?
              `,
              [productId, currentDate, currentDate],
              (err, row) => {
                if (err) return reject(err);
                if (row.count === 0) {
                  db.run(
                    'UPDATE products SET status = "på lager" WHERE id = ?',
                    [productId],
                    (err) => {
                      if (err) return reject(err);
                      console.log(`Product ${productId} status set to "på lager"`);
                      resolve();
                    }
                  );
                } else {
                  resolve();
                }
              }
            );
          })
        );

        Promise.all(updatePromises)
          .then(() => res.json({ success: true }))
          .catch((err) => {
            console.error('Error updating product statuses:', err.message);
            res.status(500).json({ error: err.message });
          });
      });
    });
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));

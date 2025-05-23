import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button, Modal, Form, Table } from 'react-bootstrap';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', location: '', status: 'på lager' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get('http://localhost:5000/api/products').then((res) => {
      console.log('Products fetched:', res.data);
      setProducts(res.data);
    });
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.location) {
      alert('Navn og lagerlokasjon kreves');
      return;
    }
    axios.post('http://localhost:5000/api/products', newProduct).then(() => {
      fetchProducts();
      setNewProduct({ name: '', location: '', status: 'på lager' });
      setShowModal(false);
    });
  };

  const updateStatus = (id, status) => {
    axios.put(`http://localhost:5000/api/products/${id}`, { status }).then(() => {
      fetchProducts();
    });
  };

  const deleteProduct = (id) => {
    if (window.confirm('Er du sikker på at du vil slette dette produktet?')) {
      axios.delete(`http://localhost:5000/api/products/${id}`).then(() => {
        fetchProducts();
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewProduct({ name: '', location: '', status: 'på lager' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Produkter</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-1"></i> Legg til produkt
        </Button>
      </div>
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Legg til produkt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="productName">
              <Form.Label>Navn</Form.Label>
              <Form.Control
                type="text"
                placeholder="Navn"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="productLocation">
              <Form.Label>Lagerlokasjon</Form.Label>
              <Form.Control
                type="text"
                placeholder="Lagerlokasjon"
                value={newProduct.location}
                onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="productStatus">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={newProduct.status}
                onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
              >
                <option value="på lager">På lager</option>
                <option value="på service">På service</option>
                <option value="på utleie">På utleie</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Avbryt
          </Button>
          <Button variant="primary" onClick={addProduct}>
            Lagre produkt
          </Button>
        </Modal.Footer>
      </Modal>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Navn</th>
            <th>Lagerlokasjon</th>
            <th>Status</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.location}</td>
              <td>{product.status}</td>
              <td>
                <Form.Select
                  value={product.status}
                  onChange={(e) => updateStatus(product.id, e.target.value)}
                  size="sm"
                  className="d-inline-block w-auto me-2"
                >
                  <option value="på lager">På lager</option>
                  <option value="på service">På service</option>
                  <option value="på utleie">På utleie</option>
                </Form.Select>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteProduct(product.id)}
                  className="me-2"
                >
                  <i className="fas fa-trash me-1"></i> Slett
                </Button>
                <Button
                  as={Link}
                  to={`/calendar/${product.id}`}
                  variant="primary"
                  size="sm"
                >
                  <i className="fas fa-calendar me-1"></i> Vis kalender
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ProductList;

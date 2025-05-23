import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button, Modal, Form, Table } from 'react-bootstrap';

function RentalsView() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [newRental, setNewRental] = useState({
    project_number: '',
    product_ids: [],
    start_date: '',
    end_date: '',
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRentals();
    fetchProducts();
  }, []);

  const fetchRentals = () => {
    axios
      .get('http://localhost:5000/api/rentals')
      .then((res) => {
        console.log('Rentals fetched:', res.data);
        setRentals(res.data);
      })
      .catch((err) => {
        console.error('Error fetching rentals:', err);
        alert('Kunne ikke hente utleier: ' + err.message);
      });
  };

  const fetchProducts = () => {
    axios
      .get('http://localhost:5000/api/products')
      .then((res) => {
        console.log('Products fetched:', res.data);
        setProducts(res.data);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        alert('Kunne ikke hente produkter: ' + err.message);
      });
  };

  const addRental = () => {
    if (!newRental.project_number || newRental.product_ids.length === 0) {
      alert('Prosjektnummer og minst ett produkt kreves');
      return;
    }
    axios
      .post('http://localhost:5000/api/rentals', newRental)
      .then((res) => {
        console.log('Rental added:', res.data);
        fetchRentals();
        setNewRental({ project_number: '', product_ids: [], start_date: '', end_date: '' });
        setShowModal(false);
      })
      .catch((err) => {
        console.error('Error adding rental:', err);
        alert(err.response?.data?.error || 'Kunne ikke legge til utleie');
      });
  };

  const deleteRental = (rentalId) => {
    if (window.confirm('Er du sikker på at du vil slette denne utleien?')) {
      axios
        .delete(`http://localhost:5000/api/rentals/${rentalId}`)
        .then(() => {
          console.log('Rental deleted:', rentalId);
          fetchRentals();
        })
        .catch((err) => {
          console.error('Error deleting rental:', err);
          alert('Kunne ikke slette utleie: ' + (err.response?.data?.error || err.message));
        });
    }
  };

  const toggleProduct = (productId) => {
    const productIds = newRental.product_ids.includes(productId)
      ? newRental.product_ids.filter((id) => id !== productId)
      : [...newRental.product_ids, productId];
    setNewRental({ ...newRental, product_ids: productIds });
  };

  const closeModal = () => {
    setShowModal(false);
    setNewRental({ project_number: '', product_ids: [], start_date: '', end_date: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Utleier/Prosjekter</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-1"></i> Legg til utleie
        </Button>
      </div>
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Legg til ny utleie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="projectNumber">
              <Form.Label>Prosjektnummer</Form.Label>
              <Form.Control
                type="text"
                placeholder="Prosjektnummer (f.eks. 102854)"
                value={newRental.project_number}
                onChange={(e) => setNewRental({ ...newRental, project_number: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="products">
              <Form.Label>Produkter</Form.Label>
              {products.map((product) => (
                <Form.Check
                  key={product.id}
                  type="checkbox"
                  label={product.name}
                  checked={newRental.product_ids.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                />
              ))}
            </Form.Group>
            <Form.Group className="mb-3" controlId="startDate">
              <Form.Label>Startdato</Form.Label>
              <Form.Control
                type="date"
                value={newRental.start_date}
                onChange={(e) => setNewRental({ ...newRental, start_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="endDate">
              <Form.Label>Sluttdato</Form.Label>
              <Form.Control
                type="date"
                value={newRental.end_date}
                onChange={(e) => setNewRental({ ...newRental, end_date: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Avbryt
          </Button>
          <Button variant="primary" onClick={addRental}>
            Lagre utleie
          </Button>
        </Modal.Footer>
      </Modal>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Prosjektnummer</th>
            <th>Startdato</th>
            <th>Sluttdato</th>
            <th>Produkter</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((rental) => (
            <tr key={rental.id}>
              <td>{rental.project_number}</td>
              <td>{rental.start_date}</td>
              <td>{rental.end_date}</td>
              <td>{rental.product_names}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteRental(rental.id)}
                  className="me-2"
                >
                  <i className="fas fa-trash me-1"></i> Slett
                </Button>
                <Button
                  as={Link}
                  to={`/calendar/${rental.id}`}
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

export default RentalsView;

import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

// Types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

// Contact Form Component
const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Alert variant="success" className="text-center p-5 rounded-3">
        <CheckCircle size={48} className="mb-3 text-success" />
        <h3 className="mb-2">Message Sent Successfully!</h3>
        <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
        <Button variant="success" onClick={() => setIsSubmitted(false)}>
          Send Another Message
        </Button>
      </Alert>
    );
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <h2 className="mb-3">Send us a Message</h2>
      <p className="mb-4 text-muted">Fill out the form below and we'll get back to you shortly.</p>
      <Row>
        <Col md={6} className="mb-3">
          <Form.Group controlId="firstName">
            <Form.Label>First Name *</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              isInvalid={!!errors.firstName}
              placeholder="Enter your first name"
            />
            <Form.Control.Feedback type="invalid">
              <AlertCircle size={16} className="me-1" />
              {errors.firstName}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6} className="mb-3">
          <Form.Group controlId="lastName">
            <Form.Label>Last Name *</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              isInvalid={!!errors.lastName}
              placeholder="Enter your last name"
            />
            <Form.Control.Feedback type="invalid">
              <AlertCircle size={16} className="me-1" />
              {errors.lastName}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6} className="mb-3">
          <Form.Group controlId="email">
            <Form.Label>Email Address *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              isInvalid={!!errors.email}
              placeholder="Enter your email"
            />
            <Form.Control.Feedback type="invalid">
              <AlertCircle size={16} className="me-1" />
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6} className="mb-3">
          <Form.Group controlId="phone">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3" controlId="subject">
        <Form.Label>Subject *</Form.Label>
        <Form.Select
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          isInvalid={!!errors.subject}
        >
          <option value="">Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="sales">Sales Question</option>
          <option value="partnership">Partnership</option>
          <option value="other">Other</option>
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          <AlertCircle size={16} className="me-1" />
          {errors.subject}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-4" controlId="message">
        <Form.Label>Message *</Form.Label>
        <Form.Control
          as="textarea"
          name="message"
          rows={6}
          value={formData.message}
          onChange={handleInputChange}
          isInvalid={!!errors.message}
          placeholder="Tell us how we can help you..."
        />
        <Form.Control.Feedback type="invalid">
          <AlertCircle size={16} className="me-1" />
          {errors.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Button
        type="submit"
        variant="primary"
        className="w-100 d-flex align-items-center justify-content-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Sending Message...
          </>
        ) : (
          <>
            <Send size={18} className="me-2" />
            Send Message
          </>
        )}
      </Button>
    </Form>
  );
};

// Main Contact Us Component
const ContactUsPage: React.FC = () => {
  return (
    <section style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e3f0fd 100%)", padding: "4rem 0" }}>
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3 text-primary">
            Contact Us
          </h1>
          <p className="lead text-secondary mx-auto" style={{ maxWidth: 600 }}>
            Have a question or want to work together? We'd love to hear from you.
          </p>
        </div>
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <div className="bg-white rounded-4 shadow-lg p-4 p-md-5">
              <ContactForm />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ContactUsPage;
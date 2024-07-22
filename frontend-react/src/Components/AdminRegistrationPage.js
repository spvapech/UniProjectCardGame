import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { request } from '../helper';

class RegistrationPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            username: '',
            password: '',
            dateOfBirth: '',
            redirectToReferrer: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        const { id, value } = event.target;
        this.setState({
            [id]: value
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        const { firstName, lastName, email, username, password, dateOfBirth } = this.state;

        request('post', '/api/register/admin', {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: password,
            dateOfBirth: dateOfBirth

        })
            .then(response => {
                console.log("Registration erfolgreich:", response.data);
                this.setState({ redirectToReferrer: true });
            })
            .catch(error => {
                console.error("Registration failed:", error.response);
            });
    }

    render() {
        if (this.state.redirectToReferrer) {
            return <Navigate to="/login" />
        }

        const containerStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw', // Änderung der Breite auf 100vw
            backgroundImage: 'url("http://localhost:8080/uploads/background2.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'white' // Textfarbe zu Weiß ändern für bessere Sichtbarkeit
        };

        const formStyle = {
            width: '80%', // Breite des Formularcontainers
            maxWidth: '400px', // Maximale Breite für kleinere Bildschirme
            margin: '0 auto', // Automatische Seitenränder für die Zentrierung
        };

        const inputContainerStyle = {
            textAlign: 'left', // Links ausrichten für die Eingabefeldbeschriftungen
        };

        const inputStyle = {
            padding: '10px',
            fontSize: '16px',
            width: '100%', // 100% Breite für die Eingabefelder
            backgroundColor: '#333333', // Dunkler Hintergrund für Inputfelder
            borderRadius: '12px',
            border: '1px solid #555',
            marginBottom: '20px',
            color: 'white', // Textfarbe der Eingaben zu Weiß ändern
            textAlign: 'left', // Links ausrichten für den Text in den Eingabefeldern
        };

        const buttonStyle = {
            padding: '15px 24px', // Vergrößertes Padding für größere Buttons
            fontSize: '16px', // Größere Schriftgröße
            backgroundColor: '#3A3B3C', // Dunkles Grau
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '10px', // Leicht vergrößerte Ecken für ein weicheres Aussehen
        };

        const hoverColor = '#2C2D2E'; // Noch dunkleres Grau

        return (
            <div style={containerStyle}>
                <h2 style={{ textAlign: 'center' }}>Admin Register</h2>
                <form onSubmit={this.handleSubmit} style={formStyle}>
                    <div className="mb-3" style={inputContainerStyle}>
                        <label htmlFor="firstName" className="form-label">Firstname:</label>
                        <input type="text" className="form-control" id="firstName" name="firstName" value={this.state.firstName} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div className="mb-3" style={inputContainerStyle}>
                        <label htmlFor="lastName" className="form-label">Lastname:</label>
                        <input type="text" className="form-control" id="lastName" name="lastName" value={this.state.lastName} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div className="mb-3" style={inputContainerStyle}>
                        <label htmlFor="email" className="form-label">Email:</label>
                        <input type="email" className="form-control" id="email" name="email" value={this.state.email} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div className="mb-3" style={inputContainerStyle}>
                        <label htmlFor="username" className="form-label">Username:</label>
                        <input type="text" className="form-control" id="username" name="username" value={this.state.username} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div className="mb-3" style={inputContainerStyle}>
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input type="password" className="form-control" id="password" name="password" value={this.state.password} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="dateOfBirth" className="form-label">Date of Birth:</label>
                        <input type="date" className="form-control" id="dateOfBirth" name="dateOfBirth" value={this.state.dateOfBirth} onChange={this.handleChange} style={inputStyle} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <button type="submit"
                                className="btn"
                                style={buttonStyle}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}>
                            Register
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default RegistrationPage;
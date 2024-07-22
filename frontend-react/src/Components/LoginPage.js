// src/pages/LoginPage.js
import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { request } from '../helper';
import { withCookies, Cookies } from 'react-cookie';
import { instanceOf } from 'prop-types';

class LoginPage extends Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            redirectToReferrer: false,
            role: 'PLAYER'
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        const { name, value } = event.target;
        this.setState({
            [name]: value
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        const { username, password } = this.state;
        const { cookies } = this.props;

        request('post', '/api/login', {
            username: username,
            password: password
        })
            .then(response => {
                console.log("Login erfolgreich:", response.data);
                const role = response.data.role;
                const userId = response.data.userId;
                this.setState({ redirectToReferrer: true, role: role });

                // Setze das userId Cookie
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('username', response.data.username);

                cookies.set('userId', userId, { path: '/' });
                // Setze das Cookie für den gesamten Benutzer (optional, falls benötigt)
                cookies.set('user', JSON.stringify(response.data), { path: '/' });
            })
            .catch(error => {
                console.error("Login fehler:", error.response);
            });
    }

    render() {
        if (this.state.redirectToReferrer) {
            if (this.state.role === 'ADMIN') {
                return <Navigate to="/admin/dashboard" />;
            } else if (this.state.role === 'PLAYER') {
                return <Navigate to="/user/dashboard" />;
            }
        }

        const containerStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw',
            backgroundImage: 'url("http://localhost:8080/uploads/background2.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'white'
        };

        const inputStyle = {
            padding: '10px',
            fontSize: '16px',
            width: '100%',
            backgroundColor: '#333333',
            borderRadius: '12px',
            border: '1px solid #555',
            marginBottom: '20px',
            color: 'white'
        };

        const buttonStyle = {
            padding: '15px 24px',
            fontSize: '16px',
            backgroundColor: '#3A3B3C',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
            borderRadius: '10px',
            marginLeft: '10px',
            marginRight: '10px'
        };

        const hoverColor = '#2C2D2E';

        return (
            <div style={containerStyle}>
                <h1 style={{ textAlign: 'center', fontSize: '24px' }}>Login</h1>
                <form onSubmit={this.handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={this.state.username}
                            onChange={this.handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={this.state.password}
                            onChange={this.handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <button type="submit"
                            style={buttonStyle}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}>
                        Login
                    </button>
                </form>
            </div>
        );
    }
}

export default withCookies(LoginPage);
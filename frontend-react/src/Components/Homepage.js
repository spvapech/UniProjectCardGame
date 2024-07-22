import React from 'react';

function Homepage() {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        margin: '0 auto',
        backgroundImage: 'url("http://localhost:8080/uploads/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
    };

    const buttonContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px'
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

    const headingStyle = {
        color: 'white'
    };

    return (
        <div className="container" style={containerStyle}>
            <h1 style={headingStyle}>SciFi-Cards</h1>
            <div style={buttonContainerStyle}>
                <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                        onClick={() => window.location.href = "/login"}>
                    Login
                </button>
                <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                        onClick={() => window.location.href = "/registrationPage"}>
                    Sign Up
                </button>
                <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                        onClick={() => window.location.href = "/registrationPage/admin"}>
                    Sign Up Admin
                </button>
            </div>
        </div>
    );
}

export default Homepage;
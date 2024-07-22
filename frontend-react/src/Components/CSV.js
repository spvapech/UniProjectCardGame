import React, { useState } from 'react';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [fileId, setFileId] = useState('');
    const [notification, setNotification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setNotification('');
    };

    const handleFileUpload = async () => {
        if (!file) {
            setNotification('Please select a file first.');
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8080/api/card/add/upload', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                setNotification(`File uploaded successfully: ${data} cards added.`);
                console.log('File upload successful:', data);
            } else {
                throw new Error('Error uploading file: ' + response.statusText);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setNotification('Error uploading file!');
        }
        setIsSubmitting(false);
    };

    const handleFileIdChange = (event) => {
        setFileId(event.target.value);
        setNotification('');
    };

    const handleFileDelete = async () => {
        if (!fileId) {
            setNotification('Please select an ID first.');
            return;
        }

        const isNumeric = value => /^\d+$/.test(value);

        if (isNumeric(fileId)) {
            setIsSubmitting(true);
            try {
                const response = await fetch(`http://localhost:8080/api/card/add/delete/${fileId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setNotification('File deleted successfully');
                    console.log('File deletion successful:', fileId);
                } else {
                    const errorText = await response.text();
                    setNotification(errorText);
                    console.log('Failed to delete file:', errorText);
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                setNotification('Error deleting file!');
            }
            setIsSubmitting(false);
        } else {
            setNotification('Invalid Input! Please enter a number.');
        }
    };

    // CSS styles
    const containerStyle = {
        backgroundImage: 'url("http://localhost:8080/uploads/background4.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: 'auto',
        color: 'white'
    };

    const inputStyle = {
        padding: '8px',
        fontSize: '14px',
        width: 'calc(100% - 16px)',
        maxWidth: '300px',
        backgroundColor: '#333333',
        borderRadius: '8px',
        border: '1px solid #555',
        marginBottom: '10px',
        color: 'white',
        textAlign: 'center'
    };

    const buttonStyle = {
        padding: '8px 16px',
        fontSize: '14px',
        width: '100%',
        maxWidth: '200px',
        backgroundColor: '#3A3B3C',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '10px',
        borderRadius: '8px'
    };

    const hoverColor = '#2C2D2E';

    // HTML
    return (
        <div className="container" style={containerStyle}>
            <h1 style={{ textAlign: 'center' }}>CSV Admin Control Panel</h1>
            <input type="file" onChange={handleFileChange} style={inputStyle} disabled={isSubmitting} />
            <button onClick={handleFileUpload} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'} disabled={isSubmitting}>
                Upload
            </button>
            <input type="text" value={fileId} onChange={handleFileIdChange} placeholder="File ID" style={inputStyle} disabled={isSubmitting} />
            <button onClick={handleFileDelete} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'} disabled={isSubmitting}>
                Delete
            </button>
            {notification && <div style={{ borderRadius: '5px', color: 'rgb(255,255,255)', textAlign: 'center' }}>
                {notification}
            </div>}
        </div>
    );
}

export default FileUpload;
import Toast from 'react-bootstrap/Toast';

function ToastError({ show, onClose, errorMessage }) {
    return (
        <Toast className="position-fixed bottom-0 end-0 m-3"
          show={show} onClose={onClose}
          bg="danger"
          style={{ color: "white" }} 
          delay={5000} autohide
        >
        <Toast.Header>
            <strong className="me-auto">Error</strong>
        </Toast.Header>
        <Toast.Body>{errorMessage}</Toast.Body>
        </Toast>
    );
}

export default ToastError;
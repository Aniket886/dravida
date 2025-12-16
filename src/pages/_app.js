import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function App({ Component, pageProps }) {
    // Check if page has custom layout
    const getLayout = Component.getLayout || ((page) => (
        <>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 200px)' }}>
                {page}
            </main>
            <Footer />
        </>
    ));

    return (
        <AuthProvider>
            <CartProvider>
                {getLayout(<Component {...pageProps} />)}
            </CartProvider>
        </AuthProvider>
    );
}

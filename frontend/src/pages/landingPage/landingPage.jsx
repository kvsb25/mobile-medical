import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, Heart, Calendar } from "lucide-react"
import { Sun, Moon, X, Menu, Phone, Mail, MapPin, Send } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { RoutesPathName } from '../../constants';

const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Function to send user message to the backend and get bot response
  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      // Add user message to the chat
      const userMessage = { type: "user", text: inputMessage };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Make a POST request to the backend
        const res = await fetch("https://faq-cb.onrender.com/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: inputMessage }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch bot response");
        }

        const data = await response.json();

        // Add bot response to the chat
        const botMessage = { type: "bot", text: data.response };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error fetching bot response:", error);
        const errorMessage = {
          type: "bot",
          text: "Sorry, I'm having trouble responding. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      // Clear the input field
      setInputMessage("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl overflow-hidden dark:bg-gray-800 z-50"
        >
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-semibold">SWAASTHYA Assistant</h3>
            <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export const LandingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <img src="\images\logo.png" alt="Swaasthya Logo" className="h-10" />
              <span className="ml-2 font-semibold text-gray-800 dark:text-white">SWAASTHYA</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <NavLink href="#home">Home</NavLink>
              <NavLink href="#services">Services</NavLink>
              <NavLink href="#Testimonial">About</NavLink>
              <NavLink href="#contact">Contact</NavLink>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => navigate(RoutesPathName.SIGNUP_PAGE)}
                className="hidden md:block px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-300">
                Sign Up
              </button>
              <button
                onClick={() => navigate(RoutesPathName.LOGIN_PAGE)}
                className="hidden md:block px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-300">
                Login
              </button>
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {isMenuOpen && <MobileMenu closeMenu={() => setIsMenuOpen(false)} />}
        </AnimatePresence>

        <main className="pt-16">
          <HeroSection />
          <ServicesSection />
          <StatsSection />
          <TestimonialSection />
          <ContactSection />
        </main>

        <Footer />

        <FAB />
      </div>
    </div>
  )
}

const NavLink = ({ href, children }) => (
  <a
    href={href}
    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
  >
    {children}
  </a>
)

const MobileMenu = ({ closeMenu }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className="fixed inset-0 z-40 bg-white dark:bg-gray-900 pt-16"
  >
    <div className="container mx-auto px-6 py-8 flex flex-col items-center space-y-6">
      <NavLink href="#home" onClick={closeMenu}>
        Home
      </NavLink>
      <NavLink href="#services" onClick={closeMenu}>
        Services
      </NavLink>
      <NavLink href="#Testimonial" onClick={closeMenu}>
        About
      </NavLink>
      <NavLink href="#contact" onClick={closeMenu}>
        Contact
      </NavLink>
      <button onClick={() => navigate('/login')}
       className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-300">
        Sign Up
      </button>
    </div>
  </motion.div>
)

const HeroSection = () => (
  <section id="home" className="bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
    <div className="container mx-auto px-6 py-24 flex flex-col md:flex-row items-center">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:w-1/2 mb-8 md:mb-0"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Seamless Healthcare Management
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Empowering healthcare providers with cutting-edge technology for better patient care.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          Get Started
        </motion.button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="md:w-1/2"
      >
        <img src="\images\doctor2.jpg" alt="Healthcare Management" className="rounded-lg shadow-xl" />
      </motion.div>
    </div>
  </section>
)

const ServicesSection = () => (
  <section id="services" className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Our Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ServiceCard
          icon={<Activity className="h-12 w-12 text-blue-600" />}
          title="Health Monitoring"
          description="Real-time health tracking and monitoring systems for patients."
        />
        <ServiceCard
          icon={<Heart className="h-12 w-12 text-blue-600" />}
          title="Patient Care"
          description="Comprehensive patient care management and support services."
        />
        <ServiceCard
          icon={<Calendar className="h-12 w-12 text-blue-600" />}
          title="Appointment Scheduling"
          description="Efficient appointment booking and management system."
        />
      </div>
    </div>
  </section>
)

const ServiceCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300"
  >
    {icon}
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
)

const StatsSection = () => (
  <section id="About" className="py-24 bg-blue-600 text-white">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatItem number="10k+" label="Patients Served" />
        <StatItem number="500+" label="Healthcare Providers" />
        <StatItem number="98%" label="Satisfaction Rate" />
      </div>
    </div>
  </section>
)

const StatItem = ({ number, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="text-center"
  >
    <div className="text-4xl font-bold mb-2">{number}</div>
    <div className="text-xl">{label}</div>
  </motion.div>
)

const TestimonialSection = () => (
  <section id="Testimonial" className="py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">What Our Clients Say</h2>
      <div className="max-w-3xl mx-auto">
        <TestimonialCarousel />
      </div>
    </div>
  </section>
)

const TestimonialCarousel = () => {
  const testimonials = [
    {
      text: "SWAASTHYA has revolutionized our patient care management. It's intuitive and efficient.",
      author: "Dr. Emily Chen, Cardiologist",
    },
    {
      text: "The real-time health monitoring feature has been a game-changer for our hospital.",
      author: "Mark Johnson, Hospital Administrator",
    },
    {
      text: "Our staff loves how easy it is to schedule and manage appointments with SWAASTHYA.",
      author: "Sarah Thompson, Clinic Manager",
    },
  ]

  const [current, setCurrent] = useState(0)

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-4">{testimonials[current].text}</p>
          <p className="font-semibold text-gray-900 dark:text-white">{testimonials[current].author}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${index === current ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
          />
        ))}
      </div>
    </div>
  )
}

const ContactSection = () => (
  <section id="contact" className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
    <div className="container mx-auto px-6 flex flex-col md:flex-row items-stretch shadow-lg rounded-lg overflow-hidden">
      <div className="w-full md:w-1/2 bg-blue-500 text-white p-10 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-4">Let's Connect</h2>
        <p className="mb-4">Whether you have a question, or simply want to connect.</p>
        <p>Feel free to send me a message in the contact form.</p>
      </div>
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 p-10 flex flex-col justify-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Contact</h2>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Name *"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email *"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            placeholder="Message"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-300"
          >
            Submit
          </motion.button>
        </form>
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">SWAASTHYA</h3>
          <p className="text-gray-400">Empowering healthcare through innovation.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <a href="#home" className="text-gray-400 hover:text-white">
                Home
              </a>
            </li>
            <li>
              <a href="#services" className="text-gray-400 hover:text-white">
                Services
              </a>
            </li>
            <li>
              <a href="#Testimonial" className="text-gray-400 hover:text-white">
                Testimonial
              </a>
            </li>
            <li>
              <a href="#contact" className="text-gray-400 hover:text-white">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Phone size={16} className="mr-2" /> +1 (555) 123-4567
            </li>
            <li className="flex items-center">
              <Mail size={16} className="mr-2" /> info@swaasthya.com
            </li>
            <li className="flex items-center">
              <MapPin size={16} className="mr-2" /> 123 Health St, Medical City
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} SWAASTHYA. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

// Updated FAB component with ChatBot integration
const FAB = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg z-50"
      >
        <Phone size={24} />
      </motion.button>
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default LandingPage;
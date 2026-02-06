import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {LandingPage} from './pages/landingPage/landingPage.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <AuthProvider>
      {/* <LandingPage></LandingPage> */}
      <App/>
    </AuthProvider>
  </React.StrictMode>,
)
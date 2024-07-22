import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import AdminRegistrationPage from "./AdminRegistrationPage";
import Homepage from "./Homepage";
import FileUpload from "./CSV";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import CreateDeckPage from "./CreateDeckPage";
import EditPage from "./EditPage";
import Shop from "./Shop";
import Leaderboard from "./Leaderboard";
import GameComponent from "./Game/GameComponent";
import FriendDashboard from "./FriendDashboard";
import ClanDashboard from "./ClanDashboard";
import MyClanDashboard from "./MyClanDashboard";
import TournamentWaitingRoom from "./Turnier/TournamentWaitingRoom";
import Tournament from "./Turnier/Tournament";
import GameComponentBot from "./Game/GameComponentBot";

function App() {
    const userId = localStorage.getItem('userId');
    return (
        <Router>
            <Routes>
                <Route path="" element={<Homepage/>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registrationPage" element={<RegistrationPage />} />
                <Route path="/registrationPage/admin" element={<AdminRegistrationPage />} />
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/csv" element={<FileUpload />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/create-deck" element={<CreateDeckPage />} />
                <Route path="/deck/edit/:deckId" element={<EditPage />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/topic/game" element={<GameComponent />} />
                <Route path="/add-friend" element={<FriendDashboard />} />
                <Route path="/friend/:friendId" element={<UserDashboard userId={userId} />} />
                <Route path="/Clan" element={<ClanDashboard />} />
                <Route path="/MyClan" element={<MyClanDashboard />} />
                <Route path="/tournament/waiting" element={<TournamentWaitingRoom />} />
                <Route path="/tournament/start" element={<Tournament/>} />
                <Route path="/topic/game/bot" element={<GameComponentBot />} />
            </Routes>
        </Router>
    );
}

export default App;
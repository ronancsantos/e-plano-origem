import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Planos from "./pages/Planos";
import Coordenador from "./pages/Coordenador";
import EditarPlano from "./pages/EditarPlano";
import VisualizarPlano from "./pages/VisualizarPlano";
import Usuarios from "./pages/Usuarios";
import PainelProfessor from "./pages/PainelProfessor";
import Professores from "./pages/Professores";
import EditarPlanoProfessor from "./pages/EditarPlanoProfessor";
import VisualizarPlanoProfessor from "./pages/VisualizarPlanoProfessor";
import DashboardCoordenador from "./pages/DashboardCoordenador";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute perfisPermitidos={["admin", "coordenador"]}>
                <Planos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/coordenador"
            element={
              <ProtectedRoute perfisPermitidos={["admin", "coordenador"]}>
                <Coordenador />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editar/:id"
            element={
              <ProtectedRoute perfisPermitidos={["admin", "coordenador"]}>
                <EditarPlano />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visualizar/:id"
            element={
              <ProtectedRoute perfisPermitidos={["admin", "coordenador"]}>
                <VisualizarPlano />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor/plano/:id/visualizar"
            element={
            <ProtectedRoute perfisPermitidos={["admin","professor","coordenador"]}>
                <VisualizarPlanoProfessor />
            </ProtectedRoute>
          }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute perfisPermitidos={["admin"]}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor"
            element={
              <ProtectedRoute perfisPermitidos={["coordenador", "professor", "admin"]}>
                <PainelProfessor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professores-cadastrados"
            element={
              <ProtectedRoute perfisPermitidos={["admin", "coordenador"]}>
                <Professores />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor/editar/:id"
            element={
              <ProtectedRoute perfisPermitidos={["professor"]}>
                <EditarPlanoProfessor />
              </ProtectedRoute>
            }
          />

           <Route
            path="/dashboard-coordenador"
            element={
              <ProtectedRoute perfisPermitidos={["coordenador", "admin"]}>
                <DashboardCoordenador />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
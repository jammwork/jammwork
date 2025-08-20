import { Route, Routes } from "react-router-dom";
import EditorPage from "@/pages/EditorPage";
import HomePage from "@/pages/HomePage";
import PrivacyPage from "@/pages/PrivacyPage";

function App() {
	return (
		<Routes>
			<Route index path="/" element={<HomePage />} />
			<Route path="/space/:spaceId" element={<EditorPage />} />
			<Route path="/privacy" element={<PrivacyPage />} />
		</Routes>
	);
}

export default App;

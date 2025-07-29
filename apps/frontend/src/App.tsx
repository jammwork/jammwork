import { Route, Routes } from "react-router-dom";
import EditorPage from "@/pages/EditorPage";
import HomePage from "@/pages/HomePage";

function App() {
	return (
		<Routes>
			<Route index path="/" element={<HomePage />} />
			<Route path="/space/:spaceId" element={<EditorPage />} />
		</Routes>
	);
}

export default App;

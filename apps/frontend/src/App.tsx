import { Route, Routes } from "react-router-dom";

import HomePage from "@/pages/HomePage";
import EditorPage from "@/pages/EditorPage";

function App() {
	return (
		<Routes>
			<Route index path="/" element={<HomePage />} />
			<Route path="/room/:roomId" element={<EditorPage />} />
		</Routes>
	);
}

export default App;

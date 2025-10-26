import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Flex, Box } from "@radix-ui/themes";
import { Header } from "./components/Layout/Header";
import { Sidebar } from "./components/Layout/Sidebar";
import { Footer } from "./components/Layout/Footer";
import { HomePage } from "./pages/HomePage";
import { FeedPage } from "./pages/FeedPage";
import { PublicationsPage } from "./pages/PublicationsPage";
import { PublicationDetailPage } from "./pages/PublicationDetailPage";
import { CreatePublicationPage } from "./pages/CreatePublicationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WriteArticlePage } from "./pages/WriteArticlePage";
import { ArticleReaderPage } from "./pages/ArticleReaderPage";
import { MySubscriptionsPage } from "./pages/MySubscriptionsPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { PublicationManagementPage } from "./pages/PublicationManagementPage";
import { PublicationArticlesPage } from "./pages/PublicationArticlesPage";
import { AnalyticsDashboardPage } from "./pages/AnalyticsDashboardPage";
import { PublicationSettingsPage } from "./pages/PublicationSettingsPage";
import { BackendInfoPage } from "./pages/BackendInfoPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ReaderThemeProvider } from "./contexts/ReaderThemeContext";
import { PublisherThemeProvider } from "./contexts/PublisherThemeContext";

function App() {
  return (
    <ReaderThemeProvider>
      <PublisherThemeProvider>
        <BrowserRouter>
      <Flex direction="column" style={{ minHeight: "100vh" }}>
        <Header />

        <Flex style={{ flex: 1 }}>
          {/* Left Sidebar - Shows when wallet connected */}
          <Sidebar />

          {/* Main Content Area */}
          <Box style={{ flex: 1, overflowX: "auto" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/publications" element={<PublicationsPage />} />
              <Route path="/publications/:id" element={<PublicationDetailPage />} />
              <Route path="/publications/:pubId/articles/:articleId" element={<ArticleReaderPage />} />
              <Route path="/articles/:articleId" element={<ArticleReaderPage />} />
              <Route path="/create-publication" element={<CreatePublicationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/write" element={<WriteArticlePage />} />
              <Route path="/dashboard/publications/:id" element={<PublicationManagementPage />} />
              <Route path="/dashboard/publications/:id/articles" element={<PublicationArticlesPage />} />
              <Route path="/dashboard/publications/:id/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/dashboard/publications/:id/settings" element={<PublicationSettingsPage />} />
              <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/backend-info" element={<BackendInfoPage />} />
            </Routes>
          </Box>
        </Flex>

        <Footer />
      </Flex>
        </BrowserRouter>
      </PublisherThemeProvider>
    </ReaderThemeProvider>
  );
}

export default App;

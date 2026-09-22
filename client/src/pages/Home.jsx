import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import HeroSection from '../components/home/HeroSection';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductSection from '../components/home/ProductSection';
import EditorialBanner from '../components/home/EditorialBanner';
import USPSection from '../components/home/USPSection';
import VideoCarousel from '../components/home/VideoCarousel';
import TestimonialCarousel from '../components/home/TestimonialCarousel';
import InstagramGrid from '../components/home/InstagramGrid';
import FeaturedCollectionGrid from '../components/home/FeaturedCollectionGrid';
import NewsletterForm from '../components/home/NewsletterForm';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import { useWebsite } from '../lib/useWebsite';

export default function Home() {
  const website = useWebsite();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => api.get('/homepage'),
  });

  if (isLoading) return <LoadingSkeleton className="h-[70vh]" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <>
      <HeroSection />
      {website.showCategories !== false && <CategoryGrid categories={data.categories} />}
      {website.showBestSellers !== false && <ProductSection title="Best sellers" viewAllHref="/best-sellers" products={data.bestSellers} />}
      {website.showEditorial !== false && <EditorialBanner />}
      {website.showNewArrivals !== false && <ProductSection title="New arrivals" viewAllHref="/new-arrivals" products={data.newArrivals} />}
      {website.showUsp !== false && <USPSection />}
      {website.showVideos !== false && <VideoCarousel videos={data.videos} />}
      {website.showTestimonials !== false && <TestimonialCarousel testimonials={data.testimonials} />}
      {website.showInstagram !== false && <InstagramGrid posts={data.instagramPosts} />}
      {website.showFeaturedCollection !== false && <FeaturedCollectionGrid collection={data.featuredCollection} />}
      {website.showNewsletter !== false && <NewsletterForm />}
    </>
  );
}

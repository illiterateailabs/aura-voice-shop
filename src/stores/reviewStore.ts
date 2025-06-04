
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ReviewState {
  reviews: Review[];
}

interface ReviewActions {
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'helpful'>) => void;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };
  markHelpful: (reviewId: string) => void;
}

type ReviewStore = ReviewState & ReviewActions;

const initialState: ReviewState = {
  reviews: [
    {
      id: '1',
      productId: '1',
      userName: 'Sarah M.',
      rating: 5,
      title: 'Amazing quality!',
      comment: 'This product exceeded my expectations. Great build quality and fast shipping.',
      verified: true,
      helpful: 12,
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      productId: '1',
      userName: 'Mike R.',
      rating: 4,
      title: 'Good value',
      comment: 'Solid product for the price. Would recommend to others.',
      verified: true,
      helpful: 8,
      createdAt: '2024-01-10T14:20:00Z',
    },
  ],
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addReview: (reviewData) => {
        const newReview: Review = {
          ...reviewData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          helpful: 0,
        };
        
        set((state) => ({
          reviews: [...state.reviews, newReview],
        }));
      },
      
      getProductReviews: (productId) => {
        const { reviews } = get();
        return reviews.filter(review => review.productId === productId);
      },
      
      getProductRating: (productId) => {
        const productReviews = get().getProductReviews(productId);
        if (productReviews.length === 0) {
          return { average: 0, count: 0 };
        }
        
        const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / productReviews.length;
        
        return {
          average: Math.round(average * 10) / 10,
          count: productReviews.length,
        };
      },
      
      markHelpful: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map(review =>
            review.id === reviewId
              ? { ...review, helpful: review.helpful + 1 }
              : review
          ),
        }));
      },
    }),
    {
      name: 'aura-shop-reviews',
    }
  )
);

import { PolicyItem } from '../types/policy';

export const debugReviewStats = (items: PolicyItem[], pageType: string) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  console.log(`\n=== ${pageType.toUpperCase()} REVIEW STATS DEBUG ===`);
  console.log(`Today: ${today.toDateString()}`);
  console.log(`30 days from now: ${thirtyDaysFromNow.toDateString()}`);
  console.log(`Total items: ${items.length}`);
  
  const itemsWithReviewDate = items.filter(item => item.next_review_date);
  console.log(`Items with review date: ${itemsWithReviewDate.length}`);
  
  const dueForReview = items.filter(p => 
    p.next_review_date && 
    new Date(p.next_review_date) <= thirtyDaysFromNow &&
    new Date(p.next_review_date) >= today
  );
  
  const overdueReviews = items.filter(p => 
    p.next_review_date && 
    new Date(p.next_review_date) < today
  );
  
  console.log(`\nItems due for review (next 30 days): ${dueForReview.length}`);
  dueForReview.forEach(item => {
    const reviewDate = new Date(item.next_review_date!);
    const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  - "${item.title}" - Review date: ${reviewDate.toDateString()} (${daysUntilReview} days)`);
  });
  
  console.log(`\nOverdue reviews: ${overdueReviews.length}`);
  overdueReviews.forEach(item => {
    const reviewDate = new Date(item.next_review_date!);
    const daysOverdue = Math.ceil((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  - "${item.title}" - Review date: ${reviewDate.toDateString()} (${daysOverdue} days overdue)`);
  });
  
  console.log(`\nSample review dates from all items:`);
  itemsWithReviewDate.slice(0, 5).forEach(item => {
    console.log(`  - "${item.title}" - Review date: ${new Date(item.next_review_date!).toDateString()}`);
  });
  
  return {
    dueForReview: dueForReview.length,
    overdueReviews: overdueReviews.length,
    totalWithReviewDate: itemsWithReviewDate.length
  };
}; 
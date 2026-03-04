/**
 * Admin Booking Management Helper
 * 
 * Use this in the browser console on the /schedule/admin page
 * to manage bookings (list, cancel, etc.)
 */

const BookingAdmin = {
  /**
   * List all bookings
   */
  async listBookings() {
    try {
      const response = await fetch('/api/schedule/admin/bookings/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        console.error('Error:', data.error);
        return [];
      }
      
      console.table(data.bookings);
      return data.bookings;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      return [];
    }
  },
  
  /**
   * Cancel a booking by ID
   */
  async cancelBooking(bookingId) {
    if (!bookingId) {
      console.error('Booking ID is required');
      return;
    }
    
    try {
      const response = await fetch('/api/schedule/admin/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        console.log(`✓ Booking ${bookingId} cancelled successfully`);
        return true;
      } else {
        console.error('Error:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return false;
    }
  },
  
  /**
   * Get bookings for a specific date
   */
  async getBookingsForDate(dateString) {
    const allBookings = await this.listBookings();
    const targetDate = new Date(dateString).toDateString();
    
    const filtered = allBookings.filter(booking => {
      const bookingDate = new Date(booking.datetime).toDateString();
      return bookingDate === targetDate;
    });
    
    console.log(`Bookings for ${dateString}:`);
    console.table(filtered);
    return filtered;
  },
  
  /**
   * Get confirmed bookings only
   */
  async getConfirmedBookings() {
    const allBookings = await this.listBookings();
    const confirmed = allBookings.filter(b => b.status === 'confirmed' || !b.status);
    console.log('Confirmed bookings:');
    console.table(confirmed);
    return confirmed;
  },
  
  /**
   * Get cancelled bookings only
   */
  async getCancelledBookings() {
    const allBookings = await this.listBookings();
    const cancelled = allBookings.filter(b => b.status === 'cancelled');
    console.log('Cancelled bookings:');
    console.table(cancelled);
    return cancelled;
  },
  
  /**
   * Show upcoming bookings
   */
  async getUpcomingBookings() {
    const allBookings = await this.listBookings();
    const now = new Date();
    
    const upcoming = allBookings
      .filter(b => (b.status === 'confirmed' || !b.status) && new Date(b.datetime) > now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    console.log('Upcoming bookings:');
    console.table(upcoming);
    return upcoming;
  },
  
  /**
   * Interactive cancellation with confirmation
   */
  async cancelWithConfirm(bookingId) {
    const bookings = await this.listBookings();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      console.error(`Booking ${bookingId} not found`);
      return false;
    }
    
    console.log('Booking to cancel:');
    console.table([booking]);
    
    const confirmed = confirm(
      `Cancel booking for ${booking.name} (${booking.email})?\n` +
      `Time: ${new Date(booking.datetime).toLocaleString()}`
    );
    
    if (confirmed) {
      return await this.cancelBooking(bookingId);
    } else {
      console.log('Cancellation aborted');
      return false;
    }
  },
  
  /**
   * Show help
   */
  help() {
    console.log(`
=== Booking Admin Helper ===

Available commands:

1. List all bookings:
   BookingAdmin.listBookings()

2. Cancel a booking:
   BookingAdmin.cancelBooking('booking-id-here')

3. Cancel with confirmation prompt:
   BookingAdmin.cancelWithConfirm('booking-id-here')

4. Get bookings for a specific date:
   BookingAdmin.getBookingsForDate('2026-03-10')

5. Show only confirmed bookings:
   BookingAdmin.getConfirmedBookings()

6. Show only cancelled bookings:
   BookingAdmin.getCancelledBookings()

7. Show upcoming bookings:
   BookingAdmin.getUpcomingBookings()

8. Show this help:
   BookingAdmin.help()

Example workflow:
  // 1. List all bookings
  await BookingAdmin.listBookings()
  
  // 2. Cancel a specific booking
  await BookingAdmin.cancelWithConfirm('abc-123-xyz')
  
  // 3. Verify it was cancelled
  await BookingAdmin.getCancelledBookings()
    `);
  }
};

// Auto-show help on load
console.log('📅 Booking Admin Helper loaded. Type BookingAdmin.help() for usage.');

// Export for use
if (typeof window !== 'undefined') {
  window.BookingAdmin = BookingAdmin;
}

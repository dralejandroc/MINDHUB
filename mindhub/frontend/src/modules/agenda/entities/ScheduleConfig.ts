/**
 * ScheduleConfig Entity
 * Business rules for professional scheduling configuration
 */

export interface TimeSlot {
  hour: number;
  minute: number;
}

export interface WorkingHours {
  startTime: TimeSlot;
  endTime: TimeSlot;
  breakStartTime?: TimeSlot;
  breakEndTime?: TimeSlot;
}

export class ScheduleConfig {
  constructor(
    public readonly professionalId: string,
    public readonly workingDays: number[], // 0-6 (Sunday to Saturday)
    public readonly workingHours: WorkingHours,
    public readonly slotDurationMinutes: number,
    public readonly blockedSlots: Date[] = [],
    public readonly maxAdvanceBookingDays: number = 90,
    public readonly minAdvanceBookingHours: number = 1,
    public readonly allowDoubleBooking: boolean = false,
    public readonly locationId?: string
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate schedule configuration
   */
  private validate(): void {
    // Validate working days
    if (this.workingDays.length === 0) {
      throw new Error('At least one working day must be configured');
    }

    this.workingDays.forEach(day => {
      if (day < 0 || day > 6) {
        throw new Error('Working days must be between 0 (Sunday) and 6 (Saturday)');
      }
    });

    // Validate working hours
    if (this.workingHours.startTime.hour < 0 || this.workingHours.startTime.hour > 23) {
      throw new Error('Start hour must be between 0 and 23');
    }

    if (this.workingHours.endTime.hour < 0 || this.workingHours.endTime.hour > 23) {
      throw new Error('End hour must be between 0 and 23');
    }

    // Business rule: End time must be after start time
    const startMinutes = this.workingHours.startTime.hour * 60 + this.workingHours.startTime.minute;
    const endMinutes = this.workingHours.endTime.hour * 60 + this.workingHours.endTime.minute;
    
    if (endMinutes <= startMinutes) {
      throw new Error('End time must be after start time');
    }

    // Validate slot duration
    if (this.slotDurationMinutes < 15 || this.slotDurationMinutes > 240) {
      throw new Error('Slot duration must be between 15 and 240 minutes');
    }

    // Validate break times if present
    if (this.workingHours.breakStartTime && this.workingHours.breakEndTime) {
      const breakStartMinutes = this.workingHours.breakStartTime.hour * 60 + this.workingHours.breakStartTime.minute;
      const breakEndMinutes = this.workingHours.breakEndTime.hour * 60 + this.workingHours.breakEndTime.minute;
      
      if (breakEndMinutes <= breakStartMinutes) {
        throw new Error('Break end time must be after break start time');
      }

      if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
        throw new Error('Break must be within working hours');
      }
    }
  }

  /**
   * Business logic: Check if a specific date/time is available
   */
  isTimeSlotAvailable(date: Date): boolean {
    // Check if it's a working day
    const dayOfWeek = date.getDay();
    if (!this.workingDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if time is within working hours
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const startMinutes = this.workingHours.startTime.hour * 60 + this.workingHours.startTime.minute;
    const endMinutes = this.workingHours.endTime.hour * 60 + this.workingHours.endTime.minute;

    if (timeInMinutes < startMinutes || timeInMinutes >= endMinutes) {
      return false;
    }

    // Check if time is during break
    if (this.workingHours.breakStartTime && this.workingHours.breakEndTime) {
      const breakStartMinutes = this.workingHours.breakStartTime.hour * 60 + this.workingHours.breakStartTime.minute;
      const breakEndMinutes = this.workingHours.breakEndTime.hour * 60 + this.workingHours.breakEndTime.minute;
      
      if (timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes) {
        return false;
      }
    }

    // Check if slot is blocked
    const isBlocked = this.blockedSlots.some(blockedSlot => 
      blockedSlot.getTime() === date.getTime()
    );

    return !isBlocked;
  }

  /**
   * Business logic: Generate available time slots for a specific date
   */
  generateTimeSlotsForDate(date: Date): Date[] {
    const slots: Date[] = [];
    
    // Check if it's a working day
    if (!this.workingDays.includes(date.getDay())) {
      return slots;
    }

    const startHour = this.workingHours.startTime.hour;
    const startMinute = this.workingHours.startTime.minute;
    const endHour = this.workingHours.endTime.hour;
    const endMinute = this.workingHours.endTime.minute;

    let currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentSlot < endTime) {
      if (this.isTimeSlotAvailable(currentSlot)) {
        slots.push(new Date(currentSlot));
      }
      currentSlot = new Date(currentSlot.getTime() + this.slotDurationMinutes * 60000);
    }

    return slots;
  }

  /**
   * Business logic: Check if booking is within allowed advance time
   */
  canBookForDate(date: Date): boolean {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Check minimum advance booking
    if (diffHours < this.minAdvanceBookingHours) {
      return false;
    }

    // Check maximum advance booking
    if (diffDays > this.maxAdvanceBookingDays) {
      return false;
    }

    return true;
  }
}
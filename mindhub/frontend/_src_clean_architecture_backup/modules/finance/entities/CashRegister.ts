/**
 * Cash Register Entity
 * Core business logic for cash register operations and daily cuts - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type CashRegisterStatus = 'open' | 'closed' | 'suspended';
export type TransactionType = 'income' | 'expense' | 'adjustment';

export interface CashTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  timestamp: Date;
  userId: string;
}

export interface DailyCutSummary {
  totalIncome: number;
  totalExpenses: number;
  totalAdjustments: number;
  netAmount: number;
  transactionCount: number;
  cashOnHand: number;
  expectedCash: number;
  difference: number;
}

export class CashRegister {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly location: string,
    public readonly status: CashRegisterStatus,
    public readonly openingBalance: number,
    public readonly currentBalance: number,
    public readonly transactions: CashTransaction[],
    public readonly openedBy: string,
    public readonly openedAt: Date,
    public readonly closedBy?: string,
    public readonly closedAt?: Date,
    public readonly lastTransactionAt?: Date,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate cash register data
   */
  private validate(): void {
    if (!this.name.trim()) {
      throw new Error('Cash register name is required');
    }

    if (!this.location.trim()) {
      throw new Error('Cash register location is required');
    }

    if (this.openingBalance < 0) {
      throw new Error('Opening balance cannot be negative');
    }

    if (this.currentBalance < 0) {
      throw new Error('Current balance cannot be negative');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Cash register must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Cash register cannot belong to both clinic and workspace');
    }

    // Business rule: Closed register must have closure info
    if (this.status === 'closed' && (!this.closedBy || !this.closedAt)) {
      throw new Error('Closed cash register must have closure information');
    }

    // Business rule: Open register cannot have closure info
    if (this.status !== 'closed' && (this.closedBy || this.closedAt)) {
      throw new Error('Open cash register cannot have closure information');
    }
  }

  /**
   * Business logic: Check if register can accept transactions
   */
  canAcceptTransactions(): boolean {
    return this.status === 'open';
  }

  /**
   * Business logic: Check if register can be closed
   */
  canBeClosed(): boolean {
    return this.status === 'open';
  }

  /**
   * Business logic: Check if register can be reopened
   */
  canBeReopened(): boolean {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // 24 hour window

    return this.status === 'closed' && 
           this.closedAt && 
           this.closedAt >= cutoffTime;
  }

  /**
   * Business logic: Add transaction to register
   */
  addTransaction(
    type: TransactionType,
    amount: number,
    description: string,
    userId: string,
    reference?: string
  ): CashRegister {
    if (!this.canAcceptTransactions()) {
      throw new Error('Cash register is not open for transactions');
    }

    if (amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    if (!description.trim()) {
      throw new Error('Transaction description is required');
    }

    const transaction: CashTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      description,
      reference,
      timestamp: new Date(),
      userId
    };

    // Calculate new balance based on transaction type
    let newBalance = this.currentBalance;
    switch (type) {
      case 'income':
        newBalance += amount;
        break;
      case 'expense':
        newBalance -= amount;
        if (newBalance < 0) {
          throw new Error('Insufficient funds in cash register');
        }
        break;
      case 'adjustment':
        newBalance = amount; // Adjustment sets absolute amount
        break;
    }

    return new CashRegister(
      this.id,
      this.name,
      this.location,
      this.status,
      this.openingBalance,
      newBalance,
      [...this.transactions, transaction],
      this.openedBy,
      this.openedAt,
      this.closedBy,
      this.closedAt,
      new Date(),
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Close cash register with daily cut
   */
  close(
    closedBy: string,
    actualCashCount: number,
    notes?: string
  ): { register: CashRegister; cut: DailyCutSummary } {
    if (!this.canBeClosed()) {
      throw new Error('Cash register cannot be closed');
    }

    const cutSummary = this.generateDailyCutSummary(actualCashCount);
    
    const updatedTransactions = notes ? [
      ...this.transactions,
      {
        id: `cut_${Date.now()}`,
        type: 'adjustment' as TransactionType,
        amount: actualCashCount,
        description: `Daily cut - Cash count: ${actualCashCount}`,
        reference: notes,
        timestamp: new Date(),
        userId: closedBy
      }
    ] : this.transactions;

    const closedRegister = new CashRegister(
      this.id,
      this.name,
      this.location,
      'closed',
      this.openingBalance,
      actualCashCount, // Set to actual counted amount
      updatedTransactions,
      this.openedBy,
      this.openedAt,
      closedBy,
      new Date(),
      this.lastTransactionAt,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );

    return {
      register: closedRegister,
      cut: cutSummary
    };
  }

  /**
   * Business logic: Suspend cash register operations
   */
  suspend(suspendedBy: string, reason: string): CashRegister {
    if (this.status !== 'open') {
      throw new Error('Only open cash registers can be suspended');
    }

    // Add suspension transaction for audit trail
    const suspensionTransaction: CashTransaction = {
      id: `suspend_${Date.now()}`,
      type: 'adjustment',
      amount: this.currentBalance,
      description: `Register suspended: ${reason}`,
      reference: `Suspended by ${suspendedBy}`,
      timestamp: new Date(),
      userId: suspendedBy
    };

    return new CashRegister(
      this.id,
      this.name,
      this.location,
      'suspended',
      this.openingBalance,
      this.currentBalance,
      [...this.transactions, suspensionTransaction],
      this.openedBy,
      this.openedAt,
      this.closedBy,
      this.closedAt,
      new Date(),
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Reopen cash register
   */
  reopen(reopenedBy: string): CashRegister {
    if (!this.canBeReopened()) {
      throw new Error('Cash register cannot be reopened');
    }

    // Add reopening transaction for audit trail
    const reopeningTransaction: CashTransaction = {
      id: `reopen_${Date.now()}`,
      type: 'adjustment',
      amount: this.currentBalance,
      description: 'Register reopened',
      reference: `Reopened by ${reopenedBy}`,
      timestamp: new Date(),
      userId: reopenedBy
    };

    return new CashRegister(
      this.id,
      this.name,
      this.location,
      'open',
      this.currentBalance, // New opening balance is current balance
      this.currentBalance,
      [...this.transactions, reopeningTransaction],
      reopenedBy, // New opener
      new Date(), // New opening time
      undefined, // Clear closure info
      undefined,
      new Date(),
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Generate daily cut summary
   */
  generateDailyCutSummary(actualCashCount: number): DailyCutSummary {
    const incomeTransactions = this.transactions.filter(t => t.type === 'income');
    const expenseTransactions = this.transactions.filter(t => t.type === 'expense');
    const adjustmentTransactions = this.transactions.filter(t => t.type === 'adjustment');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalAdjustments = adjustmentTransactions.reduce((sum, t) => sum + t.amount, 0);

    const expectedCash = this.openingBalance + totalIncome - totalExpenses;
    const difference = actualCashCount - expectedCash;

    return {
      totalIncome,
      totalExpenses,
      totalAdjustments,
      netAmount: totalIncome - totalExpenses,
      transactionCount: this.transactions.length,
      cashOnHand: actualCashCount,
      expectedCash,
      difference
    };
  }

  /**
   * Business logic: Get transactions for a specific period
   */
  getTransactionsForPeriod(startDate: Date, endDate: Date): CashTransaction[] {
    return this.transactions.filter(transaction => 
      transaction.timestamp >= startDate && transaction.timestamp <= endDate
    );
  }

  /**
   * Business logic: Get transactions by type
   */
  getTransactionsByType(type: TransactionType): CashTransaction[] {
    return this.transactions.filter(t => t.type === type);
  }

  /**
   * Business logic: Calculate operating hours
   */
  getOperatingHours(): number {
    if (!this.openedAt) return 0;
    
    const endTime = this.closedAt || new Date();
    const diffMs = endTime.getTime() - this.openedAt.getTime();
    return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // Hours with 2 decimals
  }

  /**
   * Business logic: Get transaction velocity (transactions per hour)
   */
  getTransactionVelocity(): number {
    const hours = this.getOperatingHours();
    return hours > 0 ? Math.round((this.transactions.length / hours) * 100) / 100 : 0;
  }

  /**
   * Business logic: Check if register has suspicious activity
   */
  hasSuspiciousActivity(): boolean {
    // Business rule: Too many adjustments might indicate problems
    const adjustmentCount = this.getTransactionsByType('adjustment').length;
    const adjustmentRatio = this.transactions.length > 0 ? adjustmentCount / this.transactions.length : 0;
    
    if (adjustmentRatio > 0.3) { // More than 30% adjustments
      return true;
    }

    // Business rule: Check for large discrepancies in expected vs actual cash
    if (this.status === 'closed') {
      const lastCut = this.generateDailyCutSummary(this.currentBalance);
      if (Math.abs(lastCut.difference) > lastCut.expectedCash * 0.05) { // 5% variance
        return true;
      }
    }

    return false;
  }

  /**
   * Business logic: Get formatted balance
   */
  getFormattedBalance(): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(this.currentBalance);
  }
}
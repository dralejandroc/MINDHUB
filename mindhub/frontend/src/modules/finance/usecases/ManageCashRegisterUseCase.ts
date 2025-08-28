/**
 * Manage Cash Register Use Case
 * Application business rules for cash register operations
 */

import { CashRegister, CashRegisterStatus, TransactionType, DailyCutSummary } from '../entities/CashRegister';
import { CashRegisterRepository } from '../repositories/CashRegisterRepository';

export interface OpenCashRegisterRequest {
  name: string;
  location: string;
  openingBalance: number;
  openedBy: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface AddTransactionRequest {
  cashRegisterId: string;
  type: TransactionType;
  amount: number;
  description: string;
  userId: string;
  reference?: string;
}

export interface CloseCashRegisterRequest {
  cashRegisterId: string;
  closedBy: string;
  actualCashCount: number;
  notes?: string;
}

export interface CashRegisterOperationResult {
  cashRegister: CashRegister;
  dailyCut?: DailyCutSummary;
  warnings?: string[];
}

export class ManageCashRegisterUseCase {
  constructor(
    private cashRegisterRepository: CashRegisterRepository
  ) {}

  /**
   * Open a new cash register
   */
  async openCashRegister(request: OpenCashRegisterRequest): Promise<CashRegisterOperationResult> {
    // Business rule: Validate request
    this.validateOpenRequest(request);

    // Business rule: Check for existing open registers in same location
    await this.checkExistingOpenRegisters(request.location, request.clinicId, request.workspaceId);

    // Business rule: Generate register ID
    const registerId = this.generateCashRegisterId();

    // Create cash register entity
    const cashRegister = new CashRegister(
      registerId,
      request.name,
      request.location,
      'open',
      request.openingBalance,
      request.openingBalance, // Current balance = opening balance initially
      [], // No transactions initially
      request.openedBy,
      new Date(),
      undefined,
      undefined,
      undefined,
      request.clinicId,
      request.workspaceId
    );

    // Persist cash register
    const savedRegister = await this.cashRegisterRepository.create(cashRegister);

    // Business rule: Log register opening
    await this.logRegisterOperation('opened', savedRegister);

    return {
      cashRegister: savedRegister,
      warnings: this.generateOpeningWarnings(savedRegister)
    };
  }

  /**
   * Add transaction to cash register
   */
  async addTransaction(request: AddTransactionRequest): Promise<CashRegisterOperationResult> {
    // Business rule: Validate request
    this.validateTransactionRequest(request);

    // Get existing cash register
    const cashRegister = await this.cashRegisterRepository.findById(request.cashRegisterId);
    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    // Business rule: Add transaction using entity method
    const updatedRegister = cashRegister.addTransaction(
      request.type,
      request.amount,
      request.description,
      request.userId,
      request.reference
    );

    // Persist updated register
    const savedRegister = await this.cashRegisterRepository.update(updatedRegister);

    // Business rule: Log transaction
    await this.logRegisterOperation('transaction_added', savedRegister, {
      transactionType: request.type,
      amount: request.amount,
      description: request.description
    });

    return {
      cashRegister: savedRegister,
      warnings: this.generateTransactionWarnings(savedRegister)
    };
  }

  /**
   * Close cash register with daily cut
   */
  async closeCashRegister(request: CloseCashRegisterRequest): Promise<CashRegisterOperationResult> {
    // Business rule: Validate request
    this.validateCloseRequest(request);

    // Get existing cash register
    const cashRegister = await this.cashRegisterRepository.findById(request.cashRegisterId);
    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    // Business rule: Close register using entity method
    const { register: closedRegister, cut: dailyCut } = cashRegister.close(
      request.closedBy,
      request.actualCashCount,
      request.notes
    );

    // Persist closed register
    const savedRegister = await this.cashRegisterRepository.update(closedRegister);

    // Business rule: Store daily cut summary
    await this.storeDailyCut(savedRegister.id, dailyCut);

    // Business rule: Log register closure
    await this.logRegisterOperation('closed', savedRegister, {
      actualCashCount: request.actualCashCount,
      expectedCash: dailyCut.expectedCash,
      difference: dailyCut.difference
    });

    return {
      cashRegister: savedRegister,
      dailyCut,
      warnings: this.generateClosingWarnings(savedRegister, dailyCut)
    };
  }

  /**
   * Suspend cash register operations
   */
  async suspendCashRegister(
    cashRegisterId: string,
    suspendedBy: string,
    reason: string
  ): Promise<CashRegisterOperationResult> {
    // Get existing cash register
    const cashRegister = await this.cashRegisterRepository.findById(cashRegisterId);
    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    // Business rule: Suspend using entity method
    const suspendedRegister = cashRegister.suspend(suspendedBy, reason);

    // Persist suspended register
    const savedRegister = await this.cashRegisterRepository.update(suspendedRegister);

    // Business rule: Log suspension
    await this.logRegisterOperation('suspended', savedRegister, { reason });

    return {
      cashRegister: savedRegister,
      warnings: [`Register suspended: ${reason}`]
    };
  }

  /**
   * Reopen cash register
   */
  async reopenCashRegister(
    cashRegisterId: string,
    reopenedBy: string
  ): Promise<CashRegisterOperationResult> {
    // Get existing cash register
    const cashRegister = await this.cashRegisterRepository.findById(cashRegisterId);
    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    // Business rule: Reopen using entity method
    const reopenedRegister = cashRegister.reopen(reopenedBy);

    // Persist reopened register
    const savedRegister = await this.cashRegisterRepository.update(reopenedRegister);

    // Business rule: Log reopening
    await this.logRegisterOperation('reopened', savedRegister);

    return {
      cashRegister: savedRegister,
      warnings: this.generateReopeningWarnings(savedRegister)
    };
  }

  /**
   * Get cash register summary
   */
  async getCashRegisterSummary(cashRegisterId: string): Promise<{
    cashRegister: CashRegister;
    currentCut: DailyCutSummary;
    operatingHours: number;
    transactionVelocity: number;
    suspiciousActivity: boolean;
  }> {
    const cashRegister = await this.cashRegisterRepository.findById(cashRegisterId);
    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    // Generate current cut preview (without actual cash count)
    const currentCut = cashRegister.generateDailyCutSummary(cashRegister.currentBalance);

    return {
      cashRegister,
      currentCut,
      operatingHours: cashRegister.getOperatingHours(),
      transactionVelocity: cashRegister.getTransactionVelocity(),
      suspiciousActivity: cashRegister.hasSuspiciousActivity()
    };
  }

  // Private validation methods

  /**
   * Business rule: Validate cash register opening request
   */
  private validateOpenRequest(request: OpenCashRegisterRequest): void {
    if (!request.name.trim()) {
      throw new Error('Cash register name is required');
    }

    if (!request.location.trim()) {
      throw new Error('Cash register location is required');
    }

    if (request.openingBalance < 0) {
      throw new Error('Opening balance cannot be negative');
    }

    if (!request.openedBy.trim()) {
      throw new Error('User who opened the register is required');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Cash register must belong to either a clinic or workspace');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Cash register cannot belong to both clinic and workspace');
    }

    // Business rule: Reasonable opening balance limits
    if (request.openingBalance > 10000) {
      throw new Error('Opening balance seems unusually high. Please verify the amount');
    }
  }

  /**
   * Business rule: Validate transaction request
   */
  private validateTransactionRequest(request: AddTransactionRequest): void {
    if (!request.cashRegisterId.trim()) {
      throw new Error('Cash register ID is required');
    }

    if (request.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    if (!request.description.trim()) {
      throw new Error('Transaction description is required');
    }

    if (!request.userId.trim()) {
      throw new Error('User ID is required');
    }

    // Business rule: Maximum transaction amounts for safety
    const maxAmounts = {
      income: 50000,
      expense: 10000,
      adjustment: 100000
    };

    if (request.amount > maxAmounts[request.type]) {
      throw new Error(`Transaction amount exceeds maximum allowed for ${request.type} transactions`);
    }
  }

  /**
   * Business rule: Validate cash register closing request
   */
  private validateCloseRequest(request: CloseCashRegisterRequest): void {
    if (!request.cashRegisterId.trim()) {
      throw new Error('Cash register ID is required');
    }

    if (!request.closedBy.trim()) {
      throw new Error('User who closed the register is required');
    }

    if (request.actualCashCount < 0) {
      throw new Error('Actual cash count cannot be negative');
    }

    // Business rule: Reasonable cash count limits
    if (request.actualCashCount > 500000) {
      throw new Error('Cash count seems unusually high. Please verify the amount');
    }
  }

  /**
   * Business rule: Check for existing open registers
   */
  private async checkExistingOpenRegisters(
    location: string, 
    clinicId?: string, 
    workspaceId?: string
  ): Promise<void> {
    const existingRegisters = await this.cashRegisterRepository.findByLocation(location, {
      clinicId,
      workspaceId,
      status: 'open'
    });

    if (existingRegisters.length > 0) {
      throw new Error(`There is already an open cash register at location: ${location}`);
    }
  }

  /**
   * Business rule: Store daily cut summary
   */
  private async storeDailyCut(cashRegisterId: string, dailyCut: DailyCutSummary): Promise<void> {
    try {
      // TODO: Store daily cut in separate repository for historical tracking
      const cutRecord = {
        cashRegisterId,
        date: new Date().toISOString().split('T')[0],
        ...dailyCut,
        createdAt: new Date()
      };

      console.log('Daily cut stored:', cutRecord);
      // await this.dailyCutRepository.create(cutRecord);
    } catch (error) {
      console.warn('Failed to store daily cut:', error);
      // Don't fail the operation if cut storage fails
    }
  }

  /**
   * Business rule: Log register operations for audit
   */
  private async logRegisterOperation(
    operation: string, 
    cashRegister: CashRegister, 
    additionalData?: any
  ): Promise<void> {
    try {
      const auditLog = {
        operation,
        cashRegisterId: cashRegister.id,
        cashRegisterName: cashRegister.name,
        location: cashRegister.location,
        status: cashRegister.status,
        currentBalance: cashRegister.currentBalance,
        timestamp: new Date(),
        clinicId: cashRegister.clinicId,
        workspaceId: cashRegister.workspaceId,
        ...additionalData
      };

      console.log('Cash register operation logged:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);
    } catch (error) {
      console.warn('Failed to log cash register operation:', error);
      // Don't fail the operation if logging fails
    }
  }

  // Warning generation methods

  private generateOpeningWarnings(cashRegister: CashRegister): string[] {
    const warnings: string[] = [];

    if (cashRegister.openingBalance > 5000) {
      warnings.push('High opening balance detected. Ensure proper security measures');
    }

    const hour = cashRegister.openedAt.getHours();
    if (hour < 6 || hour > 22) {
      warnings.push('Register opened outside normal business hours');
    }

    return warnings;
  }

  private generateTransactionWarnings(cashRegister: CashRegister): string[] {
    const warnings: string[] = [];

    if (cashRegister.currentBalance > 20000) {
      warnings.push('Cash register balance is high. Consider making a deposit');
    }

    if (cashRegister.hasSuspiciousActivity()) {
      warnings.push('Suspicious activity detected. Review recent transactions');
    }

    const velocity = cashRegister.getTransactionVelocity();
    if (velocity > 10) {
      warnings.push('High transaction velocity. Monitor for unusual patterns');
    }

    return warnings;
  }

  private generateClosingWarnings(cashRegister: CashRegister, dailyCut: DailyCutSummary): string[] {
    const warnings: string[] = [];

    const discrepancyPercentage = dailyCut.expectedCash > 0 
      ? Math.abs(dailyCut.difference / dailyCut.expectedCash) * 100 
      : 0;

    if (discrepancyPercentage > 5) {
      warnings.push(`Significant cash discrepancy: ${dailyCut.difference}. Investigation may be required`);
    }

    if (Math.abs(dailyCut.difference) > 500) {
      warnings.push('Large cash difference detected. Verify count and transactions');
    }

    if (dailyCut.totalAdjustments > dailyCut.totalIncome * 0.3) {
      warnings.push('High number of adjustments relative to income. Review adjustment procedures');
    }

    return warnings;
  }

  private generateReopeningWarnings(cashRegister: CashRegister): string[] {
    const warnings: string[] = [];

    if (cashRegister.closedAt) {
      const hoursSinceClosure = (new Date().getTime() - cashRegister.closedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceClosure > 24) {
        warnings.push('Register reopened after extended closure. Verify security procedures');
      }
    }

    return warnings;
  }

  /**
   * Generate unique cash register ID
   */
  private generateCashRegisterId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `cr_${timestamp}_${random}`;
  }
}
// Expense Tracker Application

class ExpenseTracker {
    constructor() {
        this.expenses = this.loadFromLocalStorage();
        this.filteredExpenses = [...this.expenses];
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateUI();
    }
    
    // DOM Elements
    initializeElements() {
        this.elements = {
            form: document.getElementById('expense-form'),
            amount: document.getElementById('amount'),
            category: document.getElementById('category'),
            description: document.getElementById('description'),
            date: document.getElementById('date'),
            expensesContainer: document.getElementById('expenses-container'),
            totalAmount: document.getElementById('total-amount'),
            expenseCount: document.getElementById('expense-count'),
            monthlyTotal: document.getElementById('monthly-total'),
            averageExpense: document.getElementById('average-expense'),
            filterCategory: document.getElementById('filter-category'),
            sortBy: document.getElementById('sort-by'),
            exportBtn: document.getElementById('export-btn'),
            clearAllBtn: document.getElementById('clear-all-btn'),
            showingCount: document.getElementById('showing-count'),
            totalCount: document.getElementById('total-count'),
            chartModal: document.getElementById('chart-modal'),
            closeModal: document.querySelector('.close-modal'),
            expenseChart: document.getElementById('expenseChart')
        };
        
        // Set default date to today
        this.elements.date.value = new Date().toISOString().split('T')[0];
    }
    
    // Event Listeners
    initializeEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Filter changes
        this.elements.filterCategory.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFiltersAndSort();
        });
        
        // Sort changes
        this.elements.sortBy.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFiltersAndSort();
        });
        
        // Export button
        this.elements.exportBtn.addEventListener('click', () => this.exportToCSV());
        
        // Clear all button
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllExpenses());
        
        // Modal close
        this.elements.closeModal.addEventListener('click', () => {
            this.elements.chartModal.classList.remove('active');
        });
        
        // Close modal when clicking outside
        this.elements.chartModal.addEventListener('click', (e) => {
            if (e.target === this.elements.chartModal) {
                this.elements.chartModal.classList.remove('active');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.elements.chartModal.classList.add('active');
                this.renderChart();
            }
            if (e.key === 'Escape') {
                this.elements.chartModal.classList.remove('active');
            }
        });
    }
    
    // Handle form submission
    handleSubmit(e) {
        e.preventDefault();
        
        const expense = {
            id: Date.now(),
            amount: parseFloat(this.elements.amount.value),
            category: this.elements.category.value,
            description: this.elements.description.value.trim(),
            date: this.elements.date.value,
            createdAt: new Date().toISOString()
        };
        
        // Validation
        if (expense.amount <= 0 || isNaN(expense.amount)) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (!expense.category) {
            alert('Please select a category');
            return;
        }
        
        this.addExpense(expense);
        this.elements.form.reset();
        this.elements.date.value = new Date().toISOString().split('T')[0];
        
        // Show success message
        this.showNotification('Expense added successfully!', 'success');
    }
    
    // Add expense to array
    addExpense(expense) {
        this.expenses.unshift(expense); // Add to beginning
        this.saveToLocalStorage();
        this.applyFiltersAndSort();
    }
    
    // Edit expense
    editExpense(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (!expense) return;
        
        // Fill form with expense data
        this.elements.amount.value = expense.amount;
        this.elements.category.value = expense.category;
        this.elements.description.value = expense.description;
        this.elements.date.value = expense.date;
        
        // Remove the expense being edited
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveToLocalStorage();
        this.applyFiltersAndSort();
        
        this.showNotification('Expense loaded for editing', 'info');
    }
    
    // Delete expense
    deleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveToLocalStorage();
        this.applyFiltersAndSort();
        
        this.showNotification('Expense deleted', 'warning');
    }
    
    // Clear all expenses
    clearAllExpenses() {
        if (this.expenses.length === 0) {
            alert('No expenses to clear');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
            this.expenses = [];
            this.saveToLocalStorage();
            this.applyFiltersAndSort();
            this.showNotification('All expenses cleared', 'warning');
        }
    }
    
    // Apply filters and sorting
    applyFiltersAndSort() {
        // Filter
        this.filteredExpenses = this.currentFilter === 'all' 
            ? [...this.expenses] 
            : this.expenses.filter(expense => expense.category === this.currentFilter);
        
        // Sort
        switch (this.currentSort) {
            case 'date-asc':
                this.filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'date-desc':
                this.filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'amount-asc':
                this.filteredExpenses.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                this.filteredExpenses.sort((a, b) => b.amount - a.amount);
                break;
        }
        
        this.updateUI();
    }
    
    // Update the entire UI
    updateUI() {
        this.renderExpenses();
        this.updateSummary();
        this.updateStats();
    }
    
    // Render expense list
    renderExpenses() {
        const container = this.elements.expensesContainer;
        
        if (this.filteredExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt fa-3x"></i>
                    <h3>No expenses found</h3>
                    <p>${this.currentFilter === 'all' 
                        ? 'Add your first expense using the form above!' 
                        : 'No expenses in this category. Try changing the filter.'}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.filteredExpenses.map(expense => this.createExpenseHTML(expense)).join('');
    }
    
    // Create HTML for a single expense
    createExpenseHTML(expense) {
        const categoryIcons = {
            food: '🍕',
            transport: '🚗',
            shopping: '🛍️',
            entertainment: '🎬',
            housing: '🏠',
            bills: '💡',
            health: '🏥',
            education: '📚',
            other: '📦'
        };
        
        const categoryNames = {
            food: 'Food & Dining',
            transport: 'Transportation',
            shopping: 'Shopping',
            entertainment: 'Entertainment',
            housing: 'Housing',
            bills: 'Bills & Utilities',
            health: 'Health',
            education: 'Education',
            other: 'Other'
        };
        
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="expense-item ${expense.category}">
                <div class="category-icon">
                    ${categoryIcons[expense.category] || '💰'}
                </div>
                <div class="expense-info">
                    <h3>${categoryNames[expense.category] || expense.category}</h3>
                    <p>${expense.description || 'No description provided'}</p>
                    <div class="expense-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}
                    </div>
                </div>
                <div class="expense-amount">
                    $${expense.amount.toFixed(2)}
                </div>
                <div class="expense-actions">
                    <button class="edit-btn" onclick="expenseTracker.editExpense(${expense.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="expenseTracker.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    // Update summary section
    updateSummary() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        this.elements.totalAmount.textContent = `$${total.toFixed(2)}`;
        
        // Update showing/total counts
        this.elements.showingCount.textContent = this.filteredExpenses.length;
        this.elements.totalCount.textContent = this.expenses.length;
    }
    
    // Update statistics
    updateStats() {
        // Total count
        this.elements.expenseCount.textContent = this.expenses.length;
        
        // Monthly total (current month)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTotal = this.expenses.reduce((sum, expense) => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getMonth() === currentMonth && 
                expenseDate.getFullYear() === currentYear) {
                return sum + expense.amount;
            }
            return sum;
        }, 0);
        
        this.elements.monthlyTotal.textContent = `$${monthlyTotal.toFixed(2)}`;
        
        // Average expense
        const average = this.expenses.length > 0 
            ? this.expenses.reduce((sum, expense) => sum + expense.amount, 0) / this.expenses.length
            : 0;
        
        this.elements.averageExpense.textContent = `$${average.toFixed(2)}`;
    }
    
    // Export to CSV
    exportToCSV() {
        if (this.expenses.length === 0) {
            alert('No expenses to export');
            return;
        }
        
        const headers = ['Date', 'Category', 'Description', 'Amount', 'Created At'];
        const csvRows = [
            headers.join(','),
            ...this.expenses.map(expense => [
                expense.date,
                expense.category,
                `"${expense.description.replace(/"/g, '""')}"`,
                expense.amount.toFixed(2),
                new Date(expense.createdAt).toLocaleString()
            ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Expenses exported to CSV', 'success');
    }
    
    // Render chart
    renderChart() {
        const ctx = this.elements.expenseChart.getContext('2d');
        
        // Destroy previous chart if exists
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }
        
        // Group expenses by category
        const categories = ['food', 'transport', 'shopping', 'entertainment', 
                           'housing', 'bills', 'health', 'education', 'other'];
        const categoryNames = ['Food', 'Transport', 'Shopping', 'Entertainment', 
                              'Housing', 'Bills', 'Health', 'Education', 'Other'];
        
        const data = categories.map(category => {
            return this.expenses
                .filter(expense => expense.category === category)
                .reduce((sum, expense) => sum + expense.amount, 0);
        });
        
        // Filter out categories with zero expenses
        const nonZeroData = data.filter(value => value > 0);
        const nonZeroCategories = categoryNames.filter((_, index) => data[index] > 0);
        
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
        ];
        
        window.expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: nonZeroCategories,
                datasets: [{
                    data: nonZeroData,
                    backgroundColor: colors.slice(0, nonZeroData.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification.success { background: linear-gradient(135deg, #00b09b, #96c93d); }
            .notification.warning { background: linear-gradient(135deg, #f46b45, #eea849); }
            .notification.info { background: linear-gradient(135deg, #4a90e2, #5d9cec); }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Local storage methods
    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }
    
    loadFromLocalStorage() {
        const data = localStorage.getItem('expenses');
        return data ? JSON.parse(data) : [];
    }
}

// Initialize the application when DOM is loaded
let expenseTracker;

document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    
    // Add chart button to header
    const header = document.querySelector('header');
    const chartBtn = document.createElement('button');
    chartBtn.className = 'action-btn chart-btn';
    chartBtn.innerHTML = '<i class="fas fa-chart-bar"></i> View Charts';
    chartBtn.style.marginTop = '15px';
    chartBtn.onclick = () => {
        document.getElementById('chart-modal').classList.add('active');
        expenseTracker.renderChart();
    };
    
    const headerContent = header.querySelector('.subtitle').parentElement;
    headerContent.appendChild(chartBtn);
});

// Make expenseTracker available globally for onclick handlers
window.expenseTracker = expenseTracker;
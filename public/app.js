// Multi-Agent Orchestrator Frontend Application
class AgentFlowApp {
    constructor() {
        this.apiBase = '/api/v1';
        this.token = localStorage.getItem('authToken');
        this.currentTab = 'create';
        this.agents = [];
        this.systemStatus = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFrameworkTemplates();
        this.checkAuthStatus();
        this.updateSystemStatus();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Agent creation form
        document.getElementById('agent-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAgent();
        });

        // Framework selection
        document.getElementById('framework-select').addEventListener('change', (e) => {
            this.loadFrameworkTemplate(e.target.value);
        });

        // Template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.loadQuickTemplate(e.currentTarget.dataset.framework);
            });
        });

        // Create system button
        document.getElementById('create-system-btn').addEventListener('click', () => {
            this.createCompleteSystem();
        });

        // Auth button
        document.getElementById('auth-btn').addEventListener('click', () => {
            this.handleAuth();
        });
    }

    async createAgent() {
        const formData = {
            framework: document.getElementById('framework-select').value,
            name: document.getElementById('agent-name').value,
            environment: document.getElementById('environment-select').value,
            permissions: document.getElementById('permissions-select').value,
            config: document.getElementById('agent-config').value
        };

        if (!formData.framework || !formData.name) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            const config = JSON.parse(formData.config || '{}');
            
            this.showLoading(true);
            const response = await this.apiCall('/orchestrator/agents', 'POST', {
                framework: formData.framework,
                name: formData.name,
                environment: formData.environment,
                permissions: formData.permissions,
                config: config
            });

            if (response.success) {
                this.showMessage('Agent created successfully!', 'success');
                document.getElementById('agent-form').reset();
                this.loadAgents();
            } else {
                this.showMessage(response.message || 'Failed to create agent', 'error');
            }
        } catch (error) {
            this.showMessage('Invalid JSON configuration', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async createCompleteSystem() {
        try {
            this.showLoading(true);
            const response = await this.apiCall('/orchestrator/system', 'POST');
            
            if (response.success) {
                this.showMessage('AgentFlow system deployed successfully!', 'success');
                this.updateSystemStatus();
            } else {
                this.showMessage(response.message || 'Failed to deploy system', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to deploy system', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.apiBase}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        return await response.json();
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageId = 'msg-' + Date.now();
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        const messageEl = document.createElement('div');
        messageEl.id = messageId;
        messageEl.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full`;
        messageEl.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="document.getElementById('${messageId}').remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            if (document.getElementById(messageId)) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    // Additional methods for tab switching, loading templates, etc.
    // ... (complete implementation available)
}

// Initialize the application
const app = new AgentFlowApp();
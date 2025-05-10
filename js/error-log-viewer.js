// Error Log Viewer Component
const ErrorLogViewer = {
    // Initialize the viewer
    init() {
        this.createViewerUI();
        this.setupEventListeners();
        this.updateErrorList();
    },
    
    // Create the viewer UI
    createViewerUI() {
        const viewer = document.createElement('div');
        viewer.id = 'error-log-viewer';
        viewer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 800px;
            max-height: 800px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            display: none;
            font-family: Arial, sans-serif;
        `;
        
        viewer.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 16px;">Error Log</h3>
                <div>
                    <button id="error-log-clear" style="margin-right: 5px; padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear</button>
                    <button id="error-log-close" style="padding: 4px 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee; background: #f5f5f5;">
                <div style="margin-bottom: 10px;">
                    <input type="text" id="error-log-search" placeholder="Search errors..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="error" checked> JavaScript
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="promise" checked> Promise
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="performance" checked> Performance
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="form_submission" checked> Form
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="form_validation" checked> Validation
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="image_load" checked> Image
                    </label>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <select id="error-time-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="all">All Time</option>
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                    <select id="error-group-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="none">No Grouping</option>
                        <option value="type">Group by Type</option>
                        <option value="message">Group by Message</option>
                        <option value="url">Group by URL</option>
                    </select>
                    <select id="error-sort-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="type">Type</option>
                        <option value="count">Count</option>
                    </select>
                    <select id="error-chart-type" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="none">No Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                    </select>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-stack-filter" checked> Include Stack Traces
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-details-filter" checked> Show Details
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-performance-filter" checked> Include Performance
                    </label>
                </div>
            </div>
            <div id="error-log-stats" style="padding: 10px; border-bottom: 1px solid #eee; background: #e3f2fd; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;">
                    <div>Total Errors: <span id="error-total">0</span></div>
                    <div>Filtered: <span id="error-filtered">0</span></div>
                    <div>Groups: <span id="error-groups">0</span></div>
                </div>
                <div id="error-type-stats" style="margin-top: 5px; display: flex; gap: 10px; flex-wrap: wrap;"></div>
            </div>
            <div id="error-log-chart" style="padding: 10px; border-bottom: 1px solid #eee; display: none;">
                <canvas id="error-chart-canvas" width="780" height="200"></canvas>
            </div>
            <div id="error-log-content" style="padding: 10px; overflow-y: auto; max-height: 400px;">
                <div id="error-log-list"></div>
            </div>
        `;
        
        document.body.appendChild(viewer);
    },
    
    // Set up event listeners
    setupEventListeners() {
        document.getElementById('error-log-close').addEventListener('click', () => {
            document.getElementById('error-log-viewer').style.display = 'none';
        });
        
        document.getElementById('error-log-clear').addEventListener('click', () => {
            ErrorReporter.clearErrors();
            this.updateErrorList();
        });
        
        // Search functionality
        document.getElementById('error-log-search').addEventListener('input', (e) => {
            this.updateErrorList();
        });
        
        // Type filter functionality
        document.querySelectorAll('.error-type-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateErrorList();
            });
        });
        
        // Time filter functionality
        document.getElementById('error-time-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        // Group filter functionality
        document.getElementById('error-group-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        // Sort filter functionality
        document.getElementById('error-sort-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        // Chart type functionality
        document.getElementById('error-chart-type').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        // Additional filter functionality
        document.getElementById('error-stack-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        document.getElementById('error-details-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        document.getElementById('error-performance-filter').addEventListener('change', () => {
            this.updateErrorList();
        });
        
        // Add keyboard shortcut (Ctrl+Shift+E)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                const viewer = document.getElementById('error-log-viewer');
                viewer.style.display = viewer.style.display === 'none' ? 'block' : 'none';
            }
        });
    },
    
    // Update the error list
    updateErrorList() {
        const errors = ErrorReporter.getErrors();
        const errorList = document.getElementById('error-log-list');
        errorList.innerHTML = '';
        
        if (errors.length === 0) {
            errorList.innerHTML = '<p style="text-align: center; color: #666;">No errors logged</p>';
            this.updateStats(errors, []);
            this.updateChart(errors, []);
            return;
        }
        
        // Get filters
        const searchTerm = document.getElementById('error-log-search').value.toLowerCase();
        const selectedTypes = Array.from(document.querySelectorAll('.error-type-filter:checked')).map(cb => cb.value);
        const timeFilter = document.getElementById('error-time-filter').value;
        const groupFilter = document.getElementById('error-group-filter').value;
        const sortFilter = document.getElementById('error-sort-filter').value;
        const chartType = document.getElementById('error-chart-type').value;
        const includeStack = document.getElementById('error-stack-filter').checked;
        const showDetails = document.getElementById('error-details-filter').checked;
        const includePerformance = document.getElementById('error-performance-filter').checked;
        
        // Apply filters
        let filteredErrors = errors.filter(error => {
            const matchesSearch = JSON.stringify(error).toLowerCase().includes(searchTerm);
            const matchesType = selectedTypes.includes(error.type);
            return matchesSearch && matchesType;
        });
        
        // Apply time filter
        filteredErrors = this.applyTimeFilter(filteredErrors, timeFilter);
        
        // Group errors if needed
        let groupedErrors = groupFilter === 'none' ? filteredErrors : this.groupErrors(filteredErrors, groupFilter);
        
        // Sort errors
        groupedErrors = this.sortErrors(groupedErrors, sortFilter);
        
        // Display errors
        if (Array.isArray(groupedErrors)) {
            this.displayErrors(groupedErrors, errorList, includeStack, showDetails, includePerformance);
        } else {
            this.displayGroupedErrors(groupedErrors, errorList, includeStack, showDetails, includePerformance);
        }
        
        // Update stats and chart
        this.updateStats(errors, filteredErrors);
        this.updateChart(errors, filteredErrors, chartType);
    },
    
    // Update the chart
    updateChart(allErrors, filteredErrors, chartType) {
        const chartContainer = document.getElementById('error-log-chart');
        const canvas = document.getElementById('error-chart-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear previous chart
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (chartType === 'none') {
            chartContainer.style.display = 'none';
            return;
        }
        
        chartContainer.style.display = 'block';
        
        // Prepare data
        const typeCounts = {};
        filteredErrors.forEach(error => {
            typeCounts[error.type] = (typeCounts[error.type] || 0) + 1;
        });
        
        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);
        const colors = labels.map(type => this.getErrorColor(type));
        
        // Draw chart
        switch (chartType) {
            case 'pie':
                this.drawPieChart(ctx, labels, data, colors);
                break;
            case 'bar':
                this.drawBarChart(ctx, labels, data, colors);
                break;
            case 'line':
                this.drawLineChart(ctx, labels, data, colors);
                break;
        }
    },
    
    // Draw pie chart
    drawPieChart(ctx, labels, data, colors) {
        const total = data.reduce((a, b) => a + b, 0);
        let startAngle = 0;
        
        data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height / 2);
            ctx.arc(canvas.width / 2, canvas.height / 2, 100, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[index];
            ctx.fill();
            
            startAngle += sliceAngle;
        });
    },
    
    // Draw bar chart
    drawBarChart(ctx, labels, data, colors) {
        const barWidth = 40;
        const spacing = 20;
        const startX = 50;
        const startY = canvas.height - 50;
        
        // Draw bars
        data.forEach((value, index) => {
            const x = startX + (barWidth + spacing) * index;
            const height = (value / Math.max(...data)) * (canvas.height - 100);
            
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, startY - height, barWidth, height);
            
            // Draw label
            ctx.fillStyle = '#000';
            ctx.fillText(labels[index], x, startY + 20);
        });
    },
    
    // Draw line chart
    drawLineChart(ctx, labels, data, colors) {
        const startX = 50;
        const startY = canvas.height - 50;
        const width = canvas.width - 100;
        const height = canvas.height - 100;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY - (data[0] / Math.max(...data)) * height);
        
        data.forEach((value, index) => {
            const x = startX + (width / (data.length - 1)) * index;
            const y = startY - (value / Math.max(...data)) * height;
            ctx.lineTo(x, y);
        });
        
        ctx.strokeStyle = '#2196F3';
        ctx.stroke();
        
        // Draw points
        data.forEach((value, index) => {
            const x = startX + (width / (data.length - 1)) * index;
            const y = startY - (value / Math.max(...data)) * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = colors[index];
            ctx.fill();
        });
    },
    
    // Apply time filter
    applyTimeFilter(errors, timeFilter) {
        if (timeFilter === 'all') return errors;
        
        const now = new Date();
        const timeRanges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        
        return errors.filter(error => {
            const errorTime = new Date(error.timestamp);
            return now - errorTime <= timeRanges[timeFilter];
        });
    },
    
    // Group errors
    groupErrors(errors, groupFilter) {
        const groups = {};
        
        errors.forEach(error => {
            let key;
            switch (groupFilter) {
                case 'type':
                    key = error.type;
                    break;
                case 'message':
                    key = error.message;
                    break;
                case 'url':
                    key = error.url;
                    break;
                default:
                    key = 'ungrouped';
            }
            
            if (!groups[key]) {
                groups[key] = {
                    key,
                    count: 0,
                    errors: []
                };
            }
            
            groups[key].count++;
            groups[key].errors.push(error);
        });
        
        return groups;
    },
    
    // Sort errors
    sortErrors(errors, sortFilter) {
        if (Array.isArray(errors)) {
            return errors.sort((a, b) => {
                switch (sortFilter) {
                    case 'newest':
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    case 'oldest':
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    case 'type':
                        return a.type.localeCompare(b.type);
                    default:
                        return 0;
                }
            });
        } else {
            // Sort groups
            return Object.values(errors).sort((a, b) => {
                switch (sortFilter) {
                    case 'count':
                        return b.count - a.count;
                    case 'type':
                        return a.key.localeCompare(b.key);
                    default:
                        return 0;
                }
            });
        }
    },
    
    // Display errors
    displayErrors(errors, container, includeStack, showDetails, includePerformance) {
        errors.forEach(error => {
            container.appendChild(this.createErrorElement(error, includeStack, showDetails, includePerformance));
        });
    },
    
    // Display grouped errors
    displayGroupedErrors(groups, container, includeStack, showDetails, includePerformance) {
        groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.style.cssText = `
                margin-bottom: 20px;
                border: 1px solid #eee;
                border-radius: 4px;
            `;
            
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 10px;
                background: #f5f5f5;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            header.innerHTML = `
                <div>
                    <strong>${group.key}</strong>
                    <span style="margin-left: 10px; color: #666;">(${group.count} errors)</span>
                </div>
                <button class="toggle-group" style="padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Show</button>
            `;
            
            const content = document.createElement('div');
            content.style.display = 'none';
            
            group.errors.forEach(error => {
                content.appendChild(this.createErrorElement(error, includeStack, showDetails, includePerformance));
            });
            
            groupElement.appendChild(header);
            groupElement.appendChild(content);
            container.appendChild(groupElement);
            
            // Toggle group visibility
            header.querySelector('.toggle-group').addEventListener('click', () => {
                const isVisible = content.style.display === 'block';
                content.style.display = isVisible ? 'none' : 'block';
                header.querySelector('.toggle-group').textContent = isVisible ? 'Show' : 'Hide';
            });
        });
    },
    
    // Create error element
    createErrorElement(error, includeStack, showDetails, includePerformance) {
        const element = document.createElement('div');
        element.style.cssText = `
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            background: #fff;
        `;
        
        const details = this.getErrorDetails(error, includePerformance);
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong style="color: ${this.getErrorColor(error.type)};">${error.type}</strong>
                    <span style="margin-left: 10px; color: #666;">${new Date(error.timestamp).toLocaleString()}</span>
                </div>
                <button class="toggle-details" style="padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Show Details</button>
            </div>
            <div style="margin-top: 5px;">${error.message}</div>
            <div class="error-details" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                ${details}
            </div>
        `;
        
        // Toggle details visibility
        element.querySelector('.toggle-details').addEventListener('click', () => {
            const detailsElement = element.querySelector('.error-details');
            const isVisible = detailsElement.style.display === 'block';
            detailsElement.style.display = isVisible ? 'none' : 'block';
            element.querySelector('.toggle-details').textContent = isVisible ? 'Show Details' : 'Hide Details';
        });
        
        return element;
    },
    
    // Update stats
    updateStats(allErrors, filteredErrors) {
        document.getElementById('error-total').textContent = allErrors.length;
        document.getElementById('error-filtered').textContent = filteredErrors.length;
        
        const typeStats = document.getElementById('error-type-stats');
        typeStats.innerHTML = '';
        
        const typeCounts = {};
        filteredErrors.forEach(error => {
            typeCounts[error.type] = (typeCounts[error.type] || 0) + 1;
        });
        
        Object.entries(typeCounts).forEach(([type, count]) => {
            const stat = document.createElement('div');
            stat.style.cssText = `
                padding: 4px 8px;
                background: ${this.getErrorColor(type)};
                color: white;
                border-radius: 4px;
                font-size: 12px;
            `;
            stat.textContent = `${type}: ${count}`;
            typeStats.appendChild(stat);
        });
    },
    
    // Get error color
    getErrorColor(type) {
        const colors = {
            error: '#f44336',
            promise: '#ff9800',
            performance: '#2196F3',
            form_submission: '#4CAF50',
            form_validation: '#9C27B0',
            image_load: '#795548'
        };
        
        return colors[type] || '#666';
    },
    
    // Get error details
    getErrorDetails(error, includePerformance) {
        let details = '';
        
        // Add stack trace if available
        if (error.stack) {
            details += `
                <div style="margin-bottom: 10px;">
                    <strong>Stack Trace:</strong>
                    <pre style="margin: 5px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; overflow-x: auto;">${error.stack}</pre>
                </div>
            `;
        }
        
        // Add performance data if available and requested
        if (includePerformance && error.type === 'performance') {
            details += `
                <div style="margin-bottom: 10px;">
                    <strong>Performance Metrics:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Load Time: ${error.loadTime}ms</li>
                        <li>DOM Ready: ${error.domReady}ms</li>
                        <li>First Paint: ${error.firstPaint}ms</li>
                    </ul>
                </div>
            `;
        }
        
        // Add common metadata
        details += `
            <div style="margin-bottom: 10px;">
                <strong>Metadata:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>URL: ${error.url}</li>
                    <li>User Agent: ${error.userAgent}</li>
                    <li>Location: ${error.location}</li>
                    <li>City: ${error.city}</li>
                    <li>State: ${error.state}</li>
                </ul>
            </div>
        `;
        
        return details;
    },
    
    // Show the viewer
    show() {
        document.getElementById('error-log-viewer').style.display = 'block';
        this.updateErrorList();
    },
    
    // Hide the viewer
    hide() {
        document.getElementById('error-log-viewer').style.display = 'none';
    }
};

// Initialize the error log viewer
ErrorLogViewer.init(); 
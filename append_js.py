with open('study.js', 'r') as f:
    content = f.read()

# Add call to initDashboardFeatures in DOMContentLoaded
content = content.replace("setTimerMode('study');", "setTimerMode('study');\n  initDashboardFeatures();")

with open('new_logic.js', 'r') as f:
    new_logic = f.read()

with open('study.js', 'w') as f:
    f.write(content + '\n\n' + new_logic)

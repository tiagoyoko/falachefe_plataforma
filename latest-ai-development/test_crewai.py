#!/usr/bin/env python3
"""
Test script for CrewAI Quickstart Project

This script demonstrates how to test CrewAI without requiring API calls.
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root / "src"))

def test_imports():
    """Test if all modules can be imported successfully."""
    try:
        from latest_ai_development.crew import LatestAiDevelopmentCrew
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_crew_structure():
    """Test if crew structure is properly defined without creating the crew."""
    try:
        from latest_ai_development.crew import LatestAiDevelopmentCrew
        
        # Test that the class can be imported and has the right methods
        crew_class = LatestAiDevelopmentCrew
        
        # Check for required methods
        required_methods = [
            'researcher', 'reporting_analyst', 'research_task', 'reporting_task', 'crew'
        ]
        
        for method_name in required_methods:
            if not hasattr(crew_class, method_name):
                print(f"❌ Missing method: {method_name}")
                return False
            print(f"✅ Method found: {method_name}")
        
        print("✅ Crew structure is properly defined")
        return True
    except Exception as e:
        print(f"❌ Crew structure test error: {e}")
        return False

def test_yaml_config():
    """Test if YAML configuration files exist and are readable."""
    try:
        import yaml
        
        # Test agents config
        agents_config_path = project_root / "src" / "latest_ai_development" / "config" / "agents.yaml"
        if not agents_config_path.exists():
            print(f"❌ Agents config file not found: {agents_config_path}")
            return False
        
        with open(agents_config_path, 'r') as f:
            agents_config = yaml.safe_load(f)
        
        expected_agents = ["researcher", "reporting_analyst"]
        for agent_name in expected_agents:
            if agent_name not in agents_config:
                print(f"❌ Missing agent in YAML config: {agent_name}")
                return False
        
        print("✅ Agents YAML config is valid")
        
        # Test tasks config
        tasks_config_path = project_root / "src" / "latest_ai_development" / "config" / "tasks.yaml"
        if not tasks_config_path.exists():
            print(f"❌ Tasks config file not found: {tasks_config_path}")
            return False
        
        with open(tasks_config_path, 'r') as f:
            tasks_config = yaml.safe_load(f)
        
        expected_tasks = ["research_task", "reporting_task"]
        for task_name in expected_tasks:
            if task_name not in tasks_config:
                print(f"❌ Missing task in YAML config: {task_name}")
                return False
        
        print("✅ Tasks YAML config is valid")
        return True
        
    except Exception as e:
        print(f"❌ YAML config test error: {e}")
        return False

def test_cli_availability():
    """Test if CrewAI CLI is available."""
    try:
        import subprocess
        result = subprocess.run(['crewai', 'version'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ CrewAI CLI is available: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ CrewAI CLI test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ CrewAI CLI test error: {e}")
        return False

def test_crewai_test_command():
    """Test if crewai test command is available."""
    try:
        import subprocess
        result = subprocess.run(['crewai', 'test', '--help'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ CrewAI test command is available")
            return True
        else:
            print(f"❌ CrewAI test command not available: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ CrewAI test command error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing CrewAI Quickstart Project")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Crew Structure Test", test_crew_structure),
        ("YAML Config Test", test_yaml_config),
        ("CLI Availability Test", test_cli_availability),
        ("CrewAI Test Command Test", test_crewai_test_command),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! CrewAI setup is working correctly.")
        print("\n📝 Next steps:")
        print("1. Configure your API keys in the .env file:")
        print("   - OPENAI_API_KEY=your-openai-api-key")
        print("   - SERPER_API_KEY=your-serper-api-key")
        print("2. Run 'crewai test' to test with actual API calls")
        print("3. Run 'crewai run' to execute your crew")
        print("4. Run 'python src/latest_ai_development/main.py' to run the crew directly")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())







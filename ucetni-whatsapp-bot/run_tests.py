#!/usr/bin/env python3
"""
Test runner script for ÚčetníBot
Provides easy interface for running different types of tests
"""
import argparse
import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd: str, description: str) -> bool:
    """Run a command and return success status"""
    print(f"\n🧪 {description}")
    print(f"Running: {cmd}")
    print("-" * 50)
    
    result = subprocess.run(cmd, shell=True)
    success = result.returncode == 0
    
    if success:
        print(f"✅ {description} - PASSED")
    else:
        print(f"❌ {description} - FAILED")
    
    return success


def main():
    parser = argparse.ArgumentParser(description="ÚčetníBot Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run unit tests")
    parser.add_argument("--integration", action="store_true", help="Run integration tests")
    parser.add_argument("--load", action="store_true", help="Run load tests")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--coverage", action="store_true", help="Generate coverage report")
    parser.add_argument("--fast", action="store_true", help="Skip slow tests")
    parser.add_argument("--parallel", "-n", type=int, help="Number of parallel workers")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    if not any([args.unit, args.integration, args.load, args.all]):
        parser.print_help()
        return
    
    # Change to project directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)
    
    # Base pytest command
    base_cmd = ["pytest"]
    
    if args.verbose:
        base_cmd.append("-v")
    
    if args.parallel:
        base_cmd.extend(["-n", str(args.parallel)])
    
    if args.coverage:
        base_cmd.extend([
            "--cov=app",
            "--cov=utils", 
            "--cov-report=html",
            "--cov-report=term-missing"
        ])
    
    success_count = 0
    total_tests = 0
    
    # Unit tests
    if args.unit or args.all:
        cmd = base_cmd + ["-m", "unit"]
        if args.fast:
            cmd.extend(["-m", "not slow"])
        
        success = run_command(" ".join(cmd), "Unit Tests")
        total_tests += 1
        if success:
            success_count += 1
    
    # Integration tests
    if args.integration or args.all:
        cmd = base_cmd + ["-m", "integration"]
        if args.fast:
            cmd.extend(["-m", "not slow"])
            
        success = run_command(" ".join(cmd), "Integration Tests")
        total_tests += 1
        if success:
            success_count += 1
    
    # Load tests
    if args.load or args.all:
        if not args.fast:  # Load tests are inherently slow
            cmd = base_cmd + ["-m", "load", "--tb=short"]
            success = run_command(" ".join(cmd), "Load Tests")
            total_tests += 1
            if success:
                success_count += 1
        else:
            print("\n⚡ Skipping load tests in fast mode")
    
    # Summary
    print("\n" + "="*60)
    print("🏁 TEST SUMMARY")
    print("="*60)
    print(f"Tests passed: {success_count}/{total_tests}")
    
    if success_count == total_tests:
        print("✅ All tests PASSED!")
        return 0
    else:
        print("❌ Some tests FAILED!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
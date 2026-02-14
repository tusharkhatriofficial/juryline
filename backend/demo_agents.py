import asyncio
import sys
import os
import json
from rich.console import Console
from rich.panel import Panel
from rich.json import JSON

# Add backend to sys.path
sys.path.append(os.getcwd())

from app.services.archestra_service import archestra_service

console = Console()

async def demo_ingest():
    console.print(Panel("[bold blue]1. Ingest Agent: Submission Validation[/bold blue]"))
    
    # Bad Submission
    bad_data = {
        "project_name": "",  # Empty name
        "repo_url": "htpp://invalid-url", # Typo
        "description": "   Just a   test   "
    }
    console.print("[bold]Input (Bad Data):[/bold]")
    console.print(JSON(json.dumps(bad_data)))
    
    console.print("\n[dim]Calling Agent...[/dim]")
    result = await archestra_service.validate_submission(bad_data)
    
    console.print("[bold green]Agent Response:[/bold green]")
    console.print(JSON(json.dumps(result)))
    console.print("\n" + "-"*50 + "\n")

async def demo_assign():
    console.print(Panel("[bold blue]2. Assignment Agent: Intelligent Load Balancing[/bold blue]"))
    
    judges = [
        {"id": "j1", "name": "Alice (Expert)", "current_load": 5},
        {"id": "j2", "name": "Bob (New)", "current_load": 0},
        {"id": "j3", "name": "Charlie (Busy)", "current_load": 8}
    ]
    submissions = [{"id": f"s{i}"} for i in range(1, 6)] # 5 submissions
    
    console.print(F"[bold]Input:[/bold] Assigning {len(submissions)} submissions to 3 judges (Loads: J1=5, J2=0, J3=8)")
    
    console.print("\n[dim]Calling Agent...[/dim]")
    result = await archestra_service.assign_judges(judges, submissions, judges_per_submission=2)
    
    console.print("[bold green]Agent Response:[/bold green]")
    console.print(JSON(json.dumps(result)))
    console.print("\n" + "-"*50 + "\n")

async def demo_feedback():
    console.print(Panel("[bold blue]3. Feedback Agent: AI Synthesis[/bold blue]"))
    
    submission = {"project_name": "EcoTracker", "description": "Tracks carbon footprint."}
    criteria = [
        {"name": "Innovation", "description": "Novelty of the idea"},
        {"name": "Execution", "description": "Quality of implementation"}
    ]
    reviews = [
        {
            "judge_id": "j1", 
            "notes": "Great concept, but the UI is clunky. API integration is solid.", 
            "scores": {"Innovation": 9, "Execution": 6}
        },
        {
            "judge_id": "j2", 
            "notes": "I love the idea! The code is a bit messy though. Needs better documentation.", 
            "scores": {"Innovation": 8, "Execution": 7}
        }
    ]
    
    console.print("[bold]Input:[/bold] 2 Judge Reviews with conflicting/varied feedback.")
    
    console.print("\n[dim]Calling Agent...[/dim]")
    result = await archestra_service.generate_feedback(submission, reviews, criteria)
    
    console.print("[bold green]Agent Response (Synthesized Feedback):[/bold green]")
    console.print(JSON(json.dumps(result)))
    console.print("\n" + "-"*50 + "\n")

async def main():
    console.print("[bold]Archestra AI Agent Demo[/bold]\n")
    try:
        await demo_ingest()
        await demo_assign()
        await demo_feedback()
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")

if __name__ == "__main__":
    asyncio.run(main())

import pytest


def pytest_configure(config):
    """
    Register custom markers for grouping tests.
    """
    config.addinivalue_line("markers", "api: mark API tests")
    config.addinivalue_line("markers", "facade: mark Facade tests")
    config.addinivalue_line("markers", "persistence: mark Persistence tests")
    config.addinivalue_line("markers", "classes: mark model/class tests")


@pytest.fixture(scope="module")
def facade():
    """
    Provide a shared HBnBFacade instance for Facade‐layer tests.
    """
    from app.services.facade import HBnBFacade

    return HBnBFacade()


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """
    After the run, print overall counts and list passed tests grouped by layer.
    """
    passed = terminalreporter.stats.get("passed", [])
    failed = len(terminalreporter.stats.get("failed", []))
    skipped = len(terminalreporter.stats.get("skipped", []))
    xfailed = len(terminalreporter.stats.get("xfailed", []))
    warnings = len(terminalreporter.stats.get("warnings", []))

    terminalreporter.write_sep("=", "Test Suite Summary")
    terminalreporter.write_line(f"✅ Passed:   {len(passed)}")
    terminalreporter.write_line(f"❌ Failed:   {failed}")
    terminalreporter.write_line(f"⚠️  Skipped:  {skipped}")
    terminalreporter.write_line(f"✳️  XFailed:  {xfailed}")
    terminalreporter.write_line(f"⚠️  Warnings: {warnings}")
    terminalreporter.write_sep("-", "Sections tested")
    terminalreporter.write_sep("-", "End of Sections")

    groups = {"API": [], "Facade": [], "Persistence": [], "Classes": []}
    for rep in passed:
        node = rep.nodeid
        name = node.split("::")[-1]
        if "test_api.py" in node:
            groups["API"].append(name)
        elif "test_facade_and_repo.py" in node:
            groups["Facade"].append(name)
        elif "test_repository" in node or "test_repo" in node:
            groups["Persistence"].append(name)
        elif "test_classes.py" in node:
            groups["Classes"].append(name)

    terminalreporter.write_line("\nExecuted Tests:")
    for section, names in groups.items():
        terminalreporter.write_line(f"  {section} ({len(names)}):")
        for n in names:
            terminalreporter.write_line(f"    - {n}")

    if failed == 0:
        terminalreporter.write_line("\nAll tests passed! 🎉")
    else:
        terminalreporter.write_line(
            "\nSome tests failed or were skipped; please see above."
        )

    terminalreporter.write_sep("=", "End of Test Suite Summary")

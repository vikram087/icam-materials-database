#!/usr/bin/env python3
"""
Simple integration tests for search server endpoints
Tests against a running server on http://localhost:8080
"""

import sys
import unittest

import requests

BASE_URL = "http://localhost:8080"


class TestSearchServer(unittest.TestCase):
    """Test suite for search server endpoints"""

    def test_1_health_endpoint(self):
        """Test GET /api/health"""
        print("\n[TEST 1] GET /api/health")

        response = requests.get(f"{BASE_URL}/api/health")

        # Validate status code
        self.assertEqual(response.status_code, 200, "Expected status 200")

        # Validate response structure
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        self.assertIn("message", data, "Response should have 'message' key")
        self.assertEqual(data["message"], "Success", "Message should be 'Success'")

        print(f"✓ Status: {response.status_code}")
        print(f"✓ Response: {data}")

    def test_2_search_papers(self):
        """Test POST /api/papers"""
        print("\n[TEST 2] POST /api/papers")

        response = requests.post(f"{BASE_URL}/api/papers", json={})

        # Validate status code
        self.assertEqual(response.status_code, 200, "Expected status 200")

        # Validate response structure
        data = response.json()
        self.assertIn("papers", data, "Response should have 'papers' key")
        self.assertIn("total", data, "Response should have 'total' key")
        self.assertIn("inflated", data, "Response should have 'inflated' key")

        # Validate papers list
        papers = data["papers"]
        self.assertIsInstance(papers, list, "Papers should be a list")
        self.assertEqual(len(papers), 10, f"Expected 10 papers, got {len(papers)}")

        # Validate total
        total = data["total"]
        self.assertIsInstance(total, int, "Total should be an integer")
        self.assertGreaterEqual(total, 10, f"Total should be >= 10, got {total}")

        print(f"✓ Status: {response.status_code}")
        print(f"✓ Papers returned: {len(papers)}")
        print(f"✓ Total papers: {total}")
        print(f"✓ Inflated: {data['inflated']}")

        # Store first paper for next test
        self.first_paper = papers[0]
        self.assertIn("id", self.first_paper, "Paper should have 'id' field")
        print(f"✓ First paper ID: {self.first_paper['id']}")

    def test_3_get_paper_by_id(self):
        """Test GET /api/papers/<paper_id>"""
        print("\n[TEST 3] GET /api/papers/<paper_id>")

        response = requests.post(f"{BASE_URL}/api/papers", json={})
        data = response.json()
        paper_id = data["papers"][0]["id"]

        print(f"  Using paper ID: {paper_id}")

        # Now test getting that specific paper
        response = requests.get(f"{BASE_URL}/api/papers/{paper_id}")

        # Validate status code
        self.assertEqual(response.status_code, 200, "Expected status 200")

        # Validate response
        paper = response.json()
        self.assertIsInstance(paper, dict, "Response should be a dictionary")

        # Validate paper has required fields
        self.assertIn("id", paper, "Paper should have 'id' field")
        self.assertEqual(paper["id"], paper_id, "Paper ID should match requested ID")

        # Validate paper has at least some standard fields
        # (Not all papers have all fields, but most should have title or summary)
        has_content = any(
            key in paper for key in ["title", "summary", "authors", "date"]
        )
        self.assertTrue(
            has_content,
            "Paper should have at least one content field (title, summary, authors, or date)",
        )

        print(f"✓ Status: {response.status_code}")
        print(f"✓ Paper ID: {paper['id']}")
        if "title" in paper:
            print(f"✓ Title: {paper['title'][:80]}...")
        if "authors" in paper:
            print(f"✓ Authors: {paper['authors'][:3]}")
        if "date" in paper:
            print(f"✓ Date: {paper['date']}")
        print("✓ Paper is valid")


def run_tests():
    """Run the test suite"""
    print("=" * 70)
    print("SEARCH SERVER INTEGRATION TESTS")
    print(f"Testing server at: {BASE_URL}")
    print("=" * 70)

    # Check if server is reachable
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=2)
        print("✓ Server is reachable")
    except requests.exceptions.ConnectionError:
        print(f"✗ ERROR: Cannot connect to server at {BASE_URL}")
        print("  Please make sure the server is running:")
        print("  python search_server.py")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print("✗ ERROR: Server timeout")
        sys.exit(1)

    print()

    # Run tests
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSearchServer)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"✓ Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"✗ Failed: {len(result.failures)}")
    print(f"✗ Errors: {len(result.errors)}")
    print("=" * 70 + "\n")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

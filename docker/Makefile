.PHONY: dev prod down

dev:
	docker-compose up --build -d

prod:
	docker-compose -f docker-compose.prod.yml up --build -d

down:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down
.PHONY: dev prod down

dev:
	docker-compose up -d --build

prod-build:
	docker-compose -f docker-compose.prod.yml up --build -d

prod:
	docker-compose -f docker-compose.prod.yml up -d

down:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down
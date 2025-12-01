---
title: Basic ElasticSearch
date: 2025-12-01
---


# 기초 개념

---

ES는 데이터를 저장하고 검색 가능해지기까지 약 1초 정도의 아주 짧은 지연만 존재한다.

주로 다양한 분야에서 빠른 조회를 위해 사용되며, 전문 검색이 필요한 통합 검색 엔진(쇼핑몰 상품 검색, 블로그 검색, 자동 완성, 오타 교정)으로 사용되며 RDBMS의 `LIKE %..%` 검색의 성능적인 단점을 보완하기 위해 도입한다.

그 외에도 로그 분석 및 모니터링, 벡터 검색 등에도 쓰인다.

# Lucene

---

ES는 루씬 라이브러리를 감싸고 있는 껍데기이며, 엔진의 핵심은 루씬이다.

데이터가 저장될 때 내부는 다음과 같이 동작한다.

1. Memory Buffer: 데이터가 들어오면 먼저 메모리 버퍼에 쌓인다. (이때 검색은불가능)
2. Refresh: 버퍼의 내용을 Segment라는 단위로 만들어 디스크(OS 캐시)로 내린다.
    1. Segment는 루씬이 데이터를 저장하는 물리적 파일 단위로, 불변이다.
    2. 이 단계부터 검색이 가능해진다.
3. Flush & Commit: OS 캐시에 있는 세그먼트를 물리적 디스크에 완전히 기록(fsync)하고, 트랜잭션로그를 비운다. 데이터 영구 보존이 확정되는 순간이다.
4. Merge: 시간이 지나면 작은 세그먼트가 너무 많아지므로, 루씬은 백그라운드에서 이들을 합쳐 더 큰 세그먼트로 만든다.

# 분산 처리 아키텍쳐

---

ES는 분산 처리를 위해 다음과 같은 핵심 아키텍쳐를 지닌다.

- Cluster(클러스터): 전체 시스템을 의미하며 하나 이상의 노드로 구성된다.
- Node(노드): 클러스터를 구성하는 개별 인스턴스를 말한다.
    - Master Node: 클러스터의 상태 관리, 인덱스 생성/삭제 등 메타데이터 관리
    - Data Node: 실제 도큐먼트(데이터)를 저장하고 검색/집계 작업을 수행
- Shard(샤드): 인덱스를 분산 저장하는 파티션 (병렬 처리의 핵심)
    - Primary Shard: 원본 인덱스 파편
    - Replica Shard: 원본의 복제본. 프라이머리 샤드에 장애가 일어나면 원본으로 승격되고 읽기의 분산 처리를 담당한다.

# Indexing, Analyzer, Query

---

## Indexing

---

ES가 빠른 이유는 다양하지만 그 중 핵심적인 이유는 바로 인덱싱(데이터 저장)을 할 때 책의 색인과 같이 저장하기 때문이다. 단순히 JSON을 디스크에 쓰는 것이 아니라 검색하기 좋은 형태로 변환하여 기록한다.

인덱싱은 다음과 같은 절차를 거친다.

1. 문장 입력: “Elasticsearch is fast”
2. 분석(Analysis): 단어 별로 쪼갠다. [elasticsearch, is, fast]
3. 역색인 저장:
    1. elasticsearch → 문서1
    2. fast → 문서1
4. 검색: fast를 검색하면 전체를 뒤지는 게 아니라, fast가 있는 문서 목록을 즉시 가져온다.

이렇게 색인되어 저장된 문서는 역색인형태로도 검색이 가능하다. 검색 시 색인과 역색인의 차이는 색인은 목록 → 키워드 이고 역색인은 키워드 → 목록이다.

## Analyzer

---

분석기(Analyzer)는 문장을 쪼개고 변환하는 도구로, 인덱싱 시 데이터를 어떻게 변환할지 결정한다. 분석기는 크게 3단계로 구성된다.

1. Character Filter: 문장 전체를 전처리한다. (예: HTML 태그 제거)
2. Tokenizer: 문장을 단어(Token)로 자른다. (예: 공백 기준, 형태소 기준)
3. Token Filter: 자른 단어를 가공한다. (예: 소문자 변환, 불용어 제거, 동의어 처리)

## Query

---

쿼리 시 검색어는 저장된 형태와 일치해야 찾을 수 있다. 

예를 들어 인덱싱 시 분석기가 적용되어 MyData.txt에 `.` 가 제거된 소문자 형태로 인덱싱되었다면 역색인은 [mydata, txt]로 저장되어 `MyData.txt`로 검색하면 검색되지 않는다.

쿼리 시엔 Query Context와 Filter Context 크게 두 가지 컨텍스트가 존재한다.

Query Context는 검색어와 도큐먼트가 얼마나 유사한가를 따져 점수를 매긴다.

- match: 분석기를 거친 풀 텍스트를 검색한다. (예: 삼성전자 검색 시 삼성, 전자가 검색됨)
- multi_match: 여러  필드에서 검색

Filter Context는 도큐먼트가 해당 조건에 맞는가를 따지고 점수는 계산하지 않는다. 캐싱되어 검색이 빠르다.

- term: 정확히 일치하는 데이터
- range: 범위 검색 (날짜, 숫자)
- bool: must, should, must_not, filter 등 여러 쿼리를 조합한다.

집계도 가능하며, 데이터를 그룹화하고 통계를 낸다. RDBMS의 GROUP BY와 유사하다.

- Metric Aggs: 산술 통계 (Min, Max, Avg, Sum)
- Bucket Aggs: 데이터를 그룹으로 나눈다
- Pipeline Aggs: 다른 집계 결과를 다시 입력으로 받아 집계한다.

# Mapping & Template

---

생성되는 인덱스에 자동으로 설정을 입히기 위해 사용된다.

```json
PUT _template/my_log_template
{
  "index_patterns": ["log-*"], // log- 로 시작하는 모든 인덱스에 적용
  "order": 1,
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": { // 커스텀 애널라이저 정의
      "analyzer": {
        "my_ngram_analyzer": {
          "tokenizer": "my_ngram_tokenizer"
        }
      },
      "tokenizer": {
        "my_ngram_tokenizer": {
          "type": "ngram",
          "min_gram": 2,
          "max_gram": 3
        }
      }
    }
  },
  "mappings": {
    "properties": { // 필드 타입 정의
      "host_name": { "type": "keyword" }, // 정확한 일치만 검색
      "message": { 
        "type": "text", 
        "analyzer": "standard" // 전문 검색
      },
      "code": {
        "type": "text",
        "analyzer": "my_ngram_analyzer" // 위에서 만든 n-gram 적용 (부분 검색 용)
      },
      "created_at": { "type": "date" }
    }
  }
}
```

# Transport Client

---

트랜스포트 클라이언트는 TCP 9300 포트를 사용하며, 7 버전 이후의 최신 버전에서는 완전히 삭제되어 `Java High Level REST Client`나 `Java API Client`를 써야 한다.
레거시 시스템을 위해 알아두는 것도 나쁘진 않다.

```java
// status 필드가 active인 문서의 keyword 검색 - Term Query
SearchResponse response = client.prepareSearch("my_index")
	.setQuery(QueryBuilders.termQuery("status", "active")
	.get();
	
// message 필드에 error 또는 failed가 포함된 텍스트 분석 검색 - Match Query
SearchResponse response = client.preparedSearch("my_index")
	.setQuery(QueryBuilders.matchQuery("message", "error failed")
	.get();
	
// Bool Query
BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
	.must(QueryBuilders.matchQuery("message", "exception"))
	.filter(QueryBuilders.termQuery("status", "error"))
	.filter(QueryBuilders.rangeQuery("created_at").gte("2024-01-01"))
	.mustNot(QueryBuilders.termQuery("region", "us-east"));
	
SearchResponse response = client.prepareSearch("my_index")
	.setQuery(boolQuery)
	.setSize(10) // 페이징
	.get();
	
// Aggregation
SearchResponse response = client.prepareSearch("my_index")
    .setSize(0) // 문서는 안 가져오고 통계만 봄
    .addAggregation(
        AggregationBuilders.terms("by_status").field("status") // 'status' 필드로 그룹핑
    )
    .get();

// 결과 파싱
Terms terms = response.getAggregations().get("by_status");
for (Terms.Bucket bucket : terms.getBuckets()) {
    System.out.println("Key: " + bucket.getKeyAsString()); // status 값
    System.out.println("DocCount: " + bucket.getDocCount()); // 개수
}
```
